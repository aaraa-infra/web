import fs from 'node:fs/promises';
import path from 'node:path';
import { getClientIp, checkRateLimit, validateUploadedFile } from '@/lib/security-validation';
import { getIpGeolocation } from '@/lib/geolocation';

const FORMBOLD_URL = 'https://formbold.com/s/oYAAv';

/* ---------- Helper: HTML escape (XSS Protection) ---------- */
function sanitizeString(str) {
  if (typeof str !== "string") return str;
  return str.trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/* ---------- Helper: Safe URL Sanitizer (Preserves valid slashes & protocols) ---------- */
function sanitizeUrl(url) {
  if (typeof url !== "string") return "Unknown";
  const trimmed = url.trim();
  if (!trimmed) return "Unknown";
  return trimmed.replace(/[<>"'\r\n]/g, "");
}

export async function POST(request) {
  try {
    const ipAddress = getClientIp(request);

    // Distributed / Hybrid Rate Limiting: Max 5 requests per 10-minute window
    const rateLimit = await checkRateLimit(ipAddress, 'submit', 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    let fields = {};
    let uploads = [];

    if (contentType.includes("application/json")) {
      fields = await request.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          if (value.name && value.size > 0) {
            const buffer = Buffer.from(await value.arrayBuffer());
            uploads.push({
              fieldname: key,
              originalname: value.name,
              mimetype: value.type,
              size: value.size,
              buffer
            });
          }
        } else {
          fields[key] = value;
        }
      }
    }

    // Safe Honeypot anti-spam check
    const hp1 = fields._honeypot;
    const hp2 = fields.company_website_hp;
    if ((typeof hp1 === 'string' && hp1.trim() !== '') || (typeof hp2 === 'string' && hp2.trim() !== '')) {
      return Response.json({ success: false, message: "Spam submission rejected." }, { status: 400 });
    }

    const formType = fields._formType || fields.formType || fields.leadType || "Project Consultation";
    const company = sanitizeString(fields.company || fields.company_name || fields.companyName || "");
    const name = sanitizeString(fields.contact_person || fields.name || fields.signatory_name || fields.full_name || fields.fullName || "");
    const category = sanitizeString(fields.vendor_category || fields.vendorCategory || "");

    const timestamp = new Date().toISOString();
    const submissionId = `AARAA-${Date.now().toString(36).toUpperCase()}`;

    const fileUrls = {};
    if (uploads.length > 0) {
      for (const up of uploads) {
        const check = validateUploadedFile(up);
        if (!check.valid) {
          return Response.json({ success: false, message: check.message }, { status: check.status || 400 });
        }
      }

      // Safe local upload write (with try...catch fallback for read-only serverless filesystems like Vercel)
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'local_uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        for (const up of uploads) {
          const sanitizedFilename = up.originalname.replace(/\s+/g, "_");
          const localFilePath = path.join(uploadDir, `${submissionId}_${sanitizedFilename}`);
          await fs.writeFile(localFilePath, up.buffer);
          fileUrls[up.fieldname] = `/local_uploads/${submissionId}_${sanitizedFilename}`;
        }
      } catch (fsUploadErr) {
        console.warn("[Local Upload Backup Warning] Could not save upload locally (read-only filesystem):", fsUploadErr.message);
      }
    }

    const geo = await getIpGeolocation(ipAddress);
    const submissionMetadata = {
      visitor_ip: geo.visitor_ip || ipAddress,
      visitor_country: geo.visitor_country || 'Unavailable',
      visitor_country_code: geo.visitor_country_code || 'Unavailable',
      visitor_state: geo.visitor_state || 'Unavailable',
      visitor_city: geo.visitor_city || 'Unavailable',
      visitor_postal_code: geo.visitor_postal_code || 'Unavailable',
      visitor_latitude: geo.visitor_latitude || 'Unavailable',
      visitor_longitude: geo.visitor_longitude || 'Unavailable',
      visitor_isp: geo.visitor_isp || 'Unavailable',
      visitor_asn: geo.visitor_asn || 'Unavailable',
      visitor_timezone: geo.visitor_timezone || 'Unavailable',
      submission_timestamp: timestamp,
      submission_page_url: sanitizeUrl(fields.submission_page_url || fields._pageUrl || fields.sourceUrl || "Unknown"),
      submission_page_title: sanitizeString(fields.submission_page_title || fields.pageTitle || "AARAA Infrastructure"),
      submission_referrer: sanitizeUrl(fields.submission_referrer || fields.referrer || "Direct / Unknown"),
      form_type: formType,
      submission_id: submissionId
    };

    const record = {
      submission_id: submissionId,
      form_type: formType,
      timestamp,
      fields,
      fileUrls,
      page_url: submissionMetadata.submission_page_url,
      ipAddress,
      metadata: submissionMetadata
    };

    // Safe local submission save (with try...catch fallback for read-only serverless filesystems like Vercel)
    try {
      const localDir = path.join(process.cwd(), 'public', 'local_submissions');
      await fs.mkdir(localDir, { recursive: true });
      const submissionPath = path.join(localDir, `submission_${submissionId}.json`);
      await fs.writeFile(submissionPath, JSON.stringify(record, null, 2), 'utf8');
    } catch (fsDirErr) {
      console.warn("[Local Submission Backup Warning] Could not save submission locally (read-only filesystem):", fsDirErr.message);
    }

    // Forward to FormBold
    try {
      const fbFormData = new FormData();
      const isContactUs = formType.toLowerCase() === 'contact' || formType.toLowerCase() === 'contact us';

      if (isContactUs) {
        // Clean 7-field FormBold payload for Contact Us enquiries
        // (5 original business fields + 2 approved technical fields: visitor_ip & submission_id)
        const contactReason = sanitizeString(fields.reason || fields.leadType || fields.reason_for_contact || "General Inquiry");
        const contactMessage = typeof fields.message === 'string' ? fields.message : '';
        const contactSubject = `New Contact Enquiry — ${name || 'Visitor'} — [${submissionId}]`;

        fbFormData.append('name', name);
        if (fields.email && typeof fields.email === 'string') fbFormData.append('email', fields.email.trim());
        if (fields.phone && typeof fields.phone === 'string') fbFormData.append('phone', fields.phone.trim());
        fbFormData.append('reason', contactReason);
        fbFormData.append('message', contactMessage);
        fbFormData.append('visitor_ip', submissionMetadata.visitor_ip);
        fbFormData.append('submission_id', submissionId);

        // FormBold System Routing Headers (envelope only, FormBold never renders '_' fields in email body)
        fbFormData.append('_subject', contactSubject);
        if (fields.email && typeof fields.email === 'string') fbFormData.append('_replyto', fields.email.trim());
        if (name) fbFormData.append('_name', name);
      } else {
        const subjectText = company 
          ? `AARAA ${formType} — ${company}${category ? ` (${category})` : ''}` 
          : `AARAA ${formType} Submission — ${name || submissionId}`;

        fbFormData.append('subject', subjectText);
        fbFormData.append('_subject', subjectText);
        fbFormData.append('form_type', formType);
        fbFormData.append('submission_id', submissionId);
        if (fields.email && typeof fields.email === 'string') fbFormData.append('_replyto', fields.email.trim());
        if (name) fbFormData.append('_name', name);

        // Append standardized visitor geolocation & submission metadata
        for (const [metaKey, metaVal] of Object.entries(submissionMetadata)) {
          if (!fbFormData.has(metaKey) && metaVal !== undefined && metaVal !== null) {
            fbFormData.append(metaKey, String(metaVal));
          }
        }

        // Safe field iteration (handles string, boolean, number, array, object)
        for (const [k, v] of Object.entries(fields)) {
          if (v === null || v === undefined) continue;
          if (k.startsWith('_') || fbFormData.has(k)) continue;

          if (typeof v === 'string') {
            if (v.trim() !== '') fbFormData.append(k, v.trim());
          } else if (typeof v === 'number' || typeof v === 'boolean') {
            fbFormData.append(k, String(v));
          } else if (Array.isArray(v)) {
            fbFormData.append(k, v.join(', '));
          } else if (typeof v === 'object') {
            fbFormData.append(k, JSON.stringify(v));
          }
        }
      }

      if (uploads.length > 0) {
        for (const up of uploads) {
          const blob = new Blob([up.buffer], { type: up.mimetype || 'application/octet-stream' });
          fbFormData.append(up.fieldname, blob, up.originalname);
        }
      }

      const fbResponse = await fetch(FORMBOLD_URL, {
        method: 'POST',
        body: fbFormData,
        headers: { 'Accept': 'application/json' }
      });

      if (!fbResponse.ok) {
        let errText = "FormBold submission failed.";
        try {
          const rawText = await fbResponse.text();
          try {
            const errJson = JSON.parse(rawText);
            errText = errJson.message || errJson.error || rawText;
          } catch {
            if (rawText && rawText.trim()) errText = rawText.slice(0, 200);
          }
        } catch (streamErr) {
          console.error("Could not read FormBold error response stream:", streamErr);
        }

        console.error(`FormBold returned status ${fbResponse.status}:`, errText);
        return Response.json({
          success: false,
          message: "Form submission encountered an issue. Please try again or email aaraainfrastructure@gmail.com directly."
        }, { status: fbResponse.status || 500 });
      }

      console.log(`[FormBold Success] ${formType} (${submissionId}) forwarded to FormBold successfully.`);
    } catch (fbErr) {
      console.error("FormBold fetch exception:", fbErr);
      return Response.json({
        success: false,
        message: "Form submission connection error. Please try again or email aaraainfrastructure@gmail.com directly."
      }, { status: 502 });
    }

    // Direct Nodemailer SMTP Notification for Contact Us (if SMTP credentials configured)
    const isContactSubmission = formType.toLowerCase() === 'contact' || formType.toLowerCase() === 'contact us';
    if (isContactSubmission && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
        const smtpSecure = process.env.SMTP_SECURE !== "false";
        const smtpTo = process.env.SMTP_TO || "aaraainfrastructure@gmail.com";

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass }
        });

        const contactReason = sanitizeString(fields.reason || fields.leadType || fields.reason_for_contact || "General Inquiry");
        const contactMessage = typeof fields.message === 'string' ? fields.message : '';
        const subject = `New Contact Enquiry — ${name || 'Visitor'} — [${submissionId}]`;

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; color: #333;">
            <h2 style="color: #ed2f39; border-bottom: 2px solid #ed2f39; padding-bottom: 10px; margin-top: 0;">New Contact Us Enquiry</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr style="background-color: #f7fafc;"><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold; width: 35%;">Full Name</td><td style="padding: 10px; border: 1px solid #cbd5e0;">${name || 'N/A'}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold;">Email Address</td><td style="padding: 10px; border: 1px solid #cbd5e0;"><a href="mailto:${fields.email || ''}">${fields.email || 'N/A'}</a></td></tr>
              <tr style="background-color: #f7fafc;"><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold;">Phone Number</td><td style="padding: 10px; border: 1px solid #cbd5e0;"><a href="tel:${fields.phone || ''}">${fields.phone || 'N/A'}</a></td></tr>
              <tr><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold;">Reason for Contact</td><td style="padding: 10px; border: 1px solid #cbd5e0;">${contactReason}</td></tr>
              <tr style="background-color: #f7fafc;"><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold; vertical-align: top;">Message</td><td style="padding: 10px; border: 1px solid #cbd5e0; white-space: pre-wrap;">${contactMessage}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold;">Sender IP Address</td><td style="padding: 10px; border: 1px solid #cbd5e0; font-family: monospace;">${submissionMetadata.visitor_ip}</td></tr>
              <tr style="background-color: #f7fafc;"><td style="padding: 10px; border: 1px solid #cbd5e0; font-weight: bold;">Submission ID</td><td style="padding: 10px; border: 1px solid #cbd5e0; font-family: monospace; font-weight: bold; color: #ed2f39;">${submissionId}</td></tr>
            </table>
            <p style="font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px;">
              Sent via AARAA Infrastructure Contact Us Portal
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"AARAA Contact Us" <${smtpUser}>`,
          to: smtpTo,
          replyTo: fields.email || smtpUser,
          subject,
          html: htmlBody
        });
      } catch (smtpErr) {
        console.warn("[Direct Contact Email Warning] Could not send direct SMTP email:", smtpErr.message);
      }
    }

    return Response.json({
      success: true,
      message: "Thank you! Your submission has been received. Our team will contact you shortly.",
      submission_id: submissionId
    });

  } catch (err) {
    console.error("Error in /api/submit route handler:", err);
    return Response.json({
      success: false,
      message: "Submission processed with internal notice. Please email aaraainfrastructure@gmail.com if not contacted within 24 hours."
    }, { status: 500 });
  }
}
