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

/* ---------- Helper: Validate Phone ---------- */
function isValidPhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/[-+ ]/g, "").slice(-10);
  return /^[6789]\d{9}$/.test(clean);
}

/* ---------- Helper: Validate Email ---------- */
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ---------- Helper: Generate Sequential Application ID (AICRYYYYMMDD-SERIALNO) ---------- */
async function generateCareerApplicationId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const prefix = `AICR${dateStr}-`;

  let maxSeq = 0;
  try {
    const localDir = path.join(process.cwd(), 'public', 'local_submissions');
    await fs.mkdir(localDir, { recursive: true });
    const files = await fs.readdir(localDir);
    for (const f of files) {
      if (f.startsWith(`careers_${prefix}`)) {
        const match = f.match(/careers_AICR\d{8}-(\d{3})\.json/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      }
    }
  } catch (err) {
    console.warn("Local storage directory read warning (expected on read-only serverless runtimes):", err.message);
  }

  const nextSeq = maxSeq > 0 
    ? String(maxSeq + 1).padStart(3, '0')
    : String(Date.now() % 1000).padStart(3, '0');

  return `${prefix}${nextSeq}`;
}

export async function POST(request) {
  try {
    const ipAddress = getClientIp(request);

    // Distributed / Hybrid Rate Limiting: Max 3 requests per 30-minute window for careers
    const rateLimit = await checkRateLimit(ipAddress, 'careers', 3, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, message: `Too many applications submitted. Please try again in ${rateLimit.retryAfter} seconds.` },
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

    // Honeypot Check
    if (fields._honeypot && String(fields._honeypot).trim() !== "") {
      return Response.json({ success: false, message: "Spam detected." }, { status: 400 });
    }

    const formType = "careers";

    // Sanitize fields
    const name = sanitizeString(fields.name || fields.full_name || "");
    const phone = sanitizeString(fields.phone || fields.mobile || "");
    const email = sanitizeString(fields.email || "");
    const message = sanitizeString(fields.message || fields.cover_message || "");
    const position = sanitizeString(fields.position || fields.job_title || "General Application");
    const jobCode = sanitizeString(fields.jobCode || fields.job_id || "N/A");
    const location = sanitizeString(fields.location || fields.current_location || "Unknown");
    const qualification = sanitizeString(fields.qualification || fields.highest_qualification || "N/A");
    const experience = sanitizeString(fields.experience || fields.years_of_experience || "N/A");
    const company = sanitizeString(fields.company || fields.current_company || "N/A");
    const consent = fields.consent === 'true' || fields.consent === true || fields.consent === 'yes';

    if (!name || !phone) {
      return Response.json({ success: false, message: "Name and Mobile Number are required." }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return Response.json({ success: false, message: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (email && !isValidEmail(email)) {
      return Response.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
    }

    // Generate Application ID in exact AICRYYYYMMDD-SERIALNO format
    const submissionId = await generateCareerApplicationId();
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];

    const fileUrls = {};

    // File validation & optional local backup
    if (uploads.length > 0) {
      for (const up of uploads) {
        const check = validateUploadedFile(up, ['.pdf', '.doc', '.docx']);
        if (!check.valid) {
          return Response.json({ success: false, message: check.message }, { status: check.status || 400 });
        }
      }

      try {
        const uploadDir = path.join(process.cwd(), 'public', 'local_uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        for (const up of uploads) {
          const sanitizedFilename = up.originalname.replace(/\s+/g, "_");
          const localFilePath = path.join(uploadDir, `${submissionId}_${sanitizedFilename}`);
          await fs.writeFile(localFilePath, up.buffer);

          const publicUrl = `/local_uploads/${submissionId}_${sanitizedFilename}`;
          fileUrls[up.fieldname] = publicUrl;
          fileUrls[`${up.fieldname}Name`] = up.originalname;
        }
      } catch (uploadErr) {
        console.warn("Local upload storage warning (expected on read-only serverless runtimes):", uploadErr.message);
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
      submission_page_url: sanitizeUrl(fields.submission_page_url || fields.sourceUrl || "Unknown"),
      submission_page_title: sanitizeString(fields.submission_page_title || fields.pageTitle || "AARAA Careers — Job Application"),
      submission_referrer: sanitizeUrl(fields.submission_referrer || fields.referrer || "Direct / Unknown"),
      form_type: formType,
      submission_id: submissionId
    };

    const record = {
      application_id: submissionId,
      submission_id: submissionId,
      form_type: formType,
      timestamp,
      createdAt: timestamp,
      full_name: name,
      phone,
      email: email || null,
      current_location: location,
      highest_qualification: qualification,
      years_of_experience: experience,
      current_company: company,
      cover_message: message,
      consent: consent ? "Yes" : "No",
      job_id: jobCode,
      job_title: position,
      application_date: dateStr,
      fileUrls,
      page_url: submissionMetadata.submission_page_url,
      ipAddress,
      lead_status: "new",
      metadata: submissionMetadata
    };

    // Save submission locally for persistence (graceful fallback on serverless)
    try {
      const localDir = path.join(process.cwd(), 'public', 'local_submissions');
      await fs.mkdir(localDir, { recursive: true });
      const submissionPath = path.join(localDir, `careers_${submissionId}.json`);
      await fs.writeFile(submissionPath, JSON.stringify(record, null, 2), 'utf8');
    } catch (saveErr) {
      console.warn("Local submission file save warning (expected on read-only serverless runtimes):", saveErr.message);
    }

    // 1. Direct Email Dispatch with ATTACHMENTS to aaraainfrastructure@gmail.com
    try {
      const smtpUser = process.env.SMTP_USER || "aaraainfrastructure@gmail.com";
      const smtpPass = process.env.SMTP_PASS || "REDACTED_SECRET";
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
      const smtpSecure = process.env.SMTP_SECURE !== "false";
      const smtpTo = process.env.SMTP_TO || "aaraainfrastructure@gmail.com";

      if (smtpUser && smtpPass) {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass }
        });

        const subject = `AARAA Career Application — ${name} — ${position} [${submissionId}]`;
        const emailAttachments = uploads.map(up => ({
          filename: up.originalname,
          content: up.buffer,
          contentType: up.mimetype || 'application/pdf'
        }));

        let htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b; background: #ffffff;">
            <div style="border-bottom: 3px solid #ed2f39; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #ed2f39; margin: 0 0 6px; font-size: 22px;">New Job Application Received</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Application ID: <strong>${submissionId}</strong> | ${timestamp}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Applied Position</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #ed2f39;">${position} (${jobCode})</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Applicant Name</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${name}</td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Mobile Number</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><a href="tel:${phone}" style="color: #0284c7; text-decoration: none; font-weight: bold;">${phone}</a></td></tr>
              <tr><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Email Address</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email || 'N/A'}</a></td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Current Location</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${location}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Highest Qualification</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${qualification}</td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Years of Experience</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${experience}</td></tr>
              ${company !== "N/A" ? `<tr><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Current Company</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${company}</td></tr>` : ''}
              ${message ? `<tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Cover Message</td><td style="padding: 10px; border: 1px solid #cbd5e1; white-space: pre-wrap;">${message}</td></tr>` : ''}
              <tr><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Attached Resume</td><td style="padding: 10px; border: 1px solid #cbd5e1; color: #059669; font-weight: bold;">📎 ${uploads.length > 0 ? uploads[0].originalname : 'No attachment'}</td></tr>
            </table>

            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 13px; color: #065f46;">
              ✔️ <strong>Attachment Status:</strong> The candidate's resume file (<code>${uploads.length > 0 ? uploads[0].originalname : 'N/A'}</code>) is directly attached to this email message.
            </div>

            <div style="margin-top: 18px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #334155;">Applicant Geolocation & Submission Metadata (Server-Derived)</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr><td style="padding: 4px; color: #64748b; width: 35%;">Visitor IP:</td><td style="padding: 4px; font-weight: bold;">${submissionMetadata.visitor_ip}</td></tr>
                <tr style="background-color: #ffffff;"><td style="padding: 4px; color: #64748b;">Approx Location:</td><td style="padding: 4px;">${submissionMetadata.visitor_city}, ${submissionMetadata.visitor_state}, ${submissionMetadata.visitor_country} (${submissionMetadata.visitor_postal_code})</td></tr>
                <tr><td style="padding: 4px; color: #64748b;">Coordinates:</td><td style="padding: 4px;">${submissionMetadata.visitor_latitude}, ${submissionMetadata.visitor_longitude}</td></tr>
                <tr style="background-color: #ffffff;"><td style="padding: 4px; color: #64748b;">Network / ISP:</td><td style="padding: 4px;">${submissionMetadata.visitor_isp} (${submissionMetadata.visitor_asn})</td></tr>
                <tr><td style="padding: 4px; color: #64748b;">Timezone & Time:</td><td style="padding: 4px;">${submissionMetadata.visitor_timezone} | ${submissionMetadata.submission_timestamp}</td></tr>
                <tr style="background-color: #ffffff;"><td style="padding: 4px; color: #64748b;">Source Page:</td><td style="padding: 4px;">${submissionMetadata.submission_page_url}</td></tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              Sent automatically by AARAA Infrastructure Careers Portal
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"AARAA Careers Portal" <${smtpUser}>`,
          to: smtpTo,
          replyTo: email || smtpUser,
          subject,
          html: htmlBody,
          attachments: emailAttachments
        });

        console.log(`[Direct SMTP Success] Career application ${submissionId} with attachment successfully emailed to ${smtpTo}.`);
      }
    } catch (smtpErr) {
      console.error("[Direct SMTP Error] Failed to send email via SMTP:", smtpErr);
    }

    // 2. Submit to FormBold for Backup Dashboard Tracking
    try {
      const fbFormData = new FormData();
      fbFormData.append('application_id', submissionId);
      fbFormData.append('subject', `AARAA Career Application — ${submissionId} — ${position}`);
      fbFormData.append('_to', 'aaraainfrastructure@gmail.com');
      fbFormData.append('_replyto', email);
      fbFormData.append('job_id', jobCode);
      fbFormData.append('job_title', position);
      fbFormData.append('full_name', name);
      fbFormData.append('email', email);
      fbFormData.append('phone', phone);
      fbFormData.append('current_location', location);
      fbFormData.append('highest_qualification', qualification);
      fbFormData.append('years_of_experience', experience);
      fbFormData.append('current_company', company);
      fbFormData.append('cover_message', message);
      fbFormData.append('consent', consent ? 'Yes' : 'No');
      fbFormData.append('application_date', dateStr);

      if (uploads.length > 0) {
        const up = uploads[0];
        const fileObj = new File([up.buffer], up.originalname, { 
          type: up.mimetype || 'application/pdf' 
        });

        fbFormData.append('resume', fileObj, up.originalname);
        fbFormData.append('attachment', fileObj, up.originalname);
        fbFormData.append('file', fileObj, up.originalname);
        fbFormData.append('attached_resume_name', up.originalname);
      }

      // Append standardized visitor geolocation & submission metadata
      for (const [metaKey, metaVal] of Object.entries(submissionMetadata)) {
        if (!fbFormData.has(metaKey) && metaVal !== undefined && metaVal !== null) {
          fbFormData.append(metaKey, String(metaVal));
        }
      }

      await fetch(FORMBOLD_URL, {
        method: 'POST',
        body: fbFormData,
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (fbErr) {
      console.warn("FormBold backup submission warning:", fbErr.message);
    }

    return Response.json({
      success: true,
      message: "Your application has been submitted successfully.",
      submission_id: submissionId,
      application_id: submissionId
    });

  } catch (err) {
    console.error("Error in /api/careers/apply route handler:", err);
    return Response.json({ success: false, message: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
