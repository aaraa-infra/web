/**
 * AARAA Infrastructure — Universal Form Submission Handler
 *
 * Handles ALL form submissions across every page. Sends payload to:
 *   - /api/forms       → Processes all form types (JSON or Multipart)
 *   - /api/config      → Fetches dynamic Turnstile Site Key configuration
 *
 * All submissions are saved to: Firebase Firestore / Local Storage (persistence first)
 * All submissions are emailed to: aaraainfrastructure@gmail.com
 */

const FORMBOLD_URL = 'https://formbold.com/s/oYAAv';

/* ============================================================
   Server-Side IP & Approximate Geolocation Enrichment
   ============================================================ */
var __aaraaClientGeo = null;
var __aaraaGeoPromise = null;

function getAaraaGeoMetadata() {
  if (__aaraaClientGeo) return Promise.resolve(__aaraaClientGeo);
  if (__aaraaGeoPromise) return __aaraaGeoPromise;

  __aaraaGeoPromise = fetch('/api/geo', {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store'
  })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(data) {
      if (data && data.success) {
        __aaraaClientGeo = data;
      }
      return __aaraaClientGeo;
    })
    .catch(function() { return null; });

  return __aaraaGeoPromise;
}

if (typeof window !== 'undefined') {
  window.getAaraaGeoMetadata = getAaraaGeoMetadata;
  if ('requestIdleCallback' in window) {
    requestIdleCallback(function() { getAaraaGeoMetadata(); });
  } else {
    setTimeout(getAaraaGeoMetadata, 1000);
  }
}

/* ============================================================
   Turnstile Disabled (FormBold Active)
   ============================================================ */
function renderAllTurnstiles() {
  // Disabled - forms are routed to FormBold
}

function startTurnstileDaemon() {
  // Disabled - forms are routed to FormBold
}

async function loadConfigAndInitTurnstile() {
  // Disabled - forms are routed to FormBold
}

window.onloadTurnstileCallback = function() {
  // Disabled - forms are routed to FormBold
};

/* ============================================================
   UI State Helpers
   ============================================================ */
function showFormLoading(form, text) {
  const overlay = form.querySelector('.form-loading-overlay');
  const textEl  = form.querySelector('.form-loading-text');
  if (overlay && textEl) {
    textEl.innerText = text;
    overlay.style.display = 'flex';
  }
  const btn = form.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    const spinner = btn.querySelector('.submit-btn-loading');
    if (spinner) spinner.style.display = 'inline-block';
  }
}

function hideFormLoading(form) {
  const overlay = form.querySelector('.form-loading-overlay');
  if (overlay) overlay.style.display = 'none';
  const btn = form.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = false;
    const spinner = btn.querySelector('.submit-btn-loading');
    if (spinner) spinner.style.display = 'none';
  }
}

function displayFieldError(form, fieldName, message) {
  const errorEl = document.getElementById(`${fieldName}-error`) ||
                  form.querySelector(`[name="${fieldName}"] ~ .form-error-msg`);
  if (errorEl) {
    errorEl.innerText = message;
    errorEl.style.display = 'block';
  }
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-error-msg').forEach(el => {
    el.style.display = 'none';
    el.innerText = '';
  });
}

/* ============================================================
   Validation Helpers
   ============================================================ */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[6789]\d{9}$/.test(phone.replace(/[-+ ]/g, '').slice(-10));
}

function checkFileValidity(file, allowedExtensions, maxSizeMB) {
  if (!file) return { valid: false, message: "File is required." };
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, message: `Invalid file type. Allowed: ${allowedExtensions.join(', ').toUpperCase()}` };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, message: `File size exceeds limit (${maxSizeMB}MB).` };
  }
  return { valid: true };
}

/* ============================================================
   Form Type Routing & Config
   ============================================================ */
const JOIN_FORM_TYPES = ['career', 'careers', 'partnership', 'jv', 'subcontractor', 'internship', 'vendor'];

const FILE_CONFIGS = {
  careers: {
    required: ['resume'],
    allowed:  { resume: ['.pdf', '.doc', '.docx'], portfolio: ['.pdf', '.doc', '.docx'] },
    sizeMB:   { resume: 5, portfolio: 5 }
  },
  career: {
    required: ['resume'],
    allowed:  { resume: ['.pdf', '.doc', '.docx'], portfolio: ['.pdf', '.doc', '.docx'] },
    sizeMB:   { resume: 5, portfolio: 5 }
  },
  partnership: {
    required: ['company_profile', 'capability_statement'],
    allowed:  { company_profile: ['.pdf', '.doc', '.docx'], capability_statement: ['.pdf', '.doc', '.docx'], brochure: ['.pdf', '.doc', '.docx'] },
    sizeMB:   { company_profile: 5, capability_statement: 5, brochure: 5 }
  },
  jv: {
    required: ['company_profile', 'reg_certificate', 'financial_doc'],
    allowed:  { company_profile: ['.pdf', '.doc', '.docx'], reg_certificate: ['.pdf', '.doc', '.docx'], financial_doc: ['.pdf', '.doc', '.docx'] },
    sizeMB:   { company_profile: 5, reg_certificate: 5, financial_doc: 5 }
  },
  subcontractor: {
    required: ['gst_cert', 'pan_copy', 'company_profile', 'work_orders'],
    allowed:  { gst_cert: ['.pdf', '.doc', '.docx'], pan_copy: ['.pdf', '.doc', '.docx'], company_profile: ['.pdf', '.doc', '.docx'], work_orders: ['.pdf', '.doc', '.docx'], safety_cert: ['.pdf', '.doc', '.docx'] },
    sizeMB:   { gst_cert: 5, pan_copy: 5, company_profile: 5, work_orders: 5, safety_cert: 5 }
  },
  internship: {
    required: ['resume', 'bonafide_cert', 'transcript'],
    allowed:  { resume: ['.pdf', '.doc', '.docx'], bonafide_cert: ['.pdf', '.doc', '.docx'], transcript: ['.pdf', '.doc', '.docx'] },
    sizeMB:   { resume: 5, bonafide_cert: 5, transcript: 5 }
  },
  vendor: {
    required: ['incorporationCert', 'incorporation_cert', 'identityProof', 'identity_proof', 'addressProof', 'address_proof'],
    allowed:  {
      incorporationCert: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      incorporation_cert: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      identityProof: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      identity_proof: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      addressProof: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      address_proof: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      tradeLicense: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      trade_license: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    },
    sizeMB:   {
      incorporationCert: 10, incorporation_cert: 10,
      identityProof: 10, identity_proof: 10,
      addressProof: 10, address_proof: 10,
      tradeLicense: 10, trade_license: 10
    }
  }
};

/* ============================================================
   Main Form Submit Handler
   ============================================================ */
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  clearFormErrors(form);

  let formType = (form.dataset.formType || 'contact').toLowerCase();
  if (formType === 'enquiry' || formType === 'quickenquiry') formType = 'enquiry';
  if (formType === 'call-me-back' || formType === 'callmeback') formType = 'callback';
  if (formType === 'career') formType = 'careers';

  const isJoinForm = JOIN_FORM_TYPES.includes(formType);
  const formData = new FormData(form);

  if (formData.get('_honeypot') && formData.get('_honeypot').toString().trim() !== '') {
    console.warn("Spam submission blocked via honeypot.");
    return;
  }

  let hasErrors = false;
  for (const [key, value] of formData.entries()) {
    if (key === '_honeypot') continue;
    const inputEl = form.querySelector(`[name="${key}"]`);
    if (inputEl && inputEl.hasAttribute('required') && (!value || value.toString().trim() === '')) {
      displayFieldError(form, key, "This field is required.");
      hasErrors = true;
    }
    if (key === 'email' && value && !isValidEmail(value.toString().trim())) {
      displayFieldError(form, key, "Please enter a valid email address.");
      hasErrors = true;
    }
    if ((key === 'phone' || key === 'mobile' || key === 'clientPhone') && value) {
      if (!isValidPhone(value.toString().trim())) {
        displayFieldError(form, key, "Please enter a valid 10-digit mobile number.");
        hasErrors = true;
      }
    }
  }

  if (isJoinForm && FILE_CONFIGS[formType]) {
    const config = FILE_CONFIGS[formType];
    for (const [fieldName, allowedExts] of Object.entries(config.allowed)) {
      const inputEl    = form.querySelector(`[name="${fieldName}"]`);
      const file       = formData.get(fieldName);
      const isRequired = inputEl && inputEl.hasAttribute('required');
      const limitMB    = config.sizeMB[fieldName] || 5;

      if (file && file instanceof File && file.size > 0) {
        const check = checkFileValidity(file, allowedExts, limitMB);
        if (!check.valid) { displayFieldError(form, fieldName, check.message); hasErrors = true; }
      } else if (isRequired) {
        displayFieldError(form, fieldName, "This document is mandatory.");
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    const firstError = form.querySelector('.form-error-msg[style*="display: block"]');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  try {
    const loadingText = isJoinForm ? "Uploading documents and submitting..." : formType === 'newsletter' ? "Subscribing..." : "Submitting your enquiry...";
    showFormLoading(form, loadingText);

    formData.append('formType',   formType);
    formData.append('sourceUrl',  window.location.href);
    formData.append('pageTitle',  document.title);

    if (!formData.has('subject')) {
      const companyVal = formData.get('company') || formData.get('company_name') || '';
      const nameVal = formData.get('name') || formData.get('contact_person') || formData.get('full_name') || '';
      const categoryVal = formData.get('vendorCategory') || formData.get('vendor_category') || '';
      const subj = formType === 'vendor'
        ? `AARAA Vendor Registration — ${companyVal || nameVal || 'Company'}${categoryVal ? ` (${categoryVal})` : ''}`
        : `AARAA ${formType.toUpperCase()} Submission — ${companyVal || nameVal || 'New Lead'}`;
      formData.append('subject', subj);
      formData.append('_subject', subj);
    }
    const emailVal = formData.get('email');
    if (emailVal) formData.append('_replyto', emailVal);
    const personName = formData.get('name') || formData.get('contact_person') || formData.get('full_name');
    if (personName) formData.append('_name', personName);

    // Enrich with server-side IP & approximate geolocation metadata (max 500ms timeout budget)
    var geoData = null;
    try {
      geoData = await Promise.race([
        getAaraaGeoMetadata(),
        new Promise(function(resolve) { setTimeout(function() { resolve(null); }, 500); })
      ]);
    } catch(geoErr) {}

    var nowIso = new Date().toISOString();
    var submissionMeta = {
      visitor_ip: (geoData && geoData.visitor_ip) ? geoData.visitor_ip : 'Unavailable',
      visitor_country: (geoData && geoData.visitor_country) ? geoData.visitor_country : 'Unavailable',
      visitor_country_code: (geoData && geoData.visitor_country_code) ? geoData.visitor_country_code : 'Unavailable',
      visitor_state: (geoData && geoData.visitor_state) ? geoData.visitor_state : 'Unavailable',
      visitor_city: (geoData && geoData.visitor_city) ? geoData.visitor_city : 'Unavailable',
      visitor_postal_code: (geoData && geoData.visitor_postal_code) ? geoData.visitor_postal_code : 'Unavailable',
      visitor_latitude: (geoData && geoData.visitor_latitude) ? geoData.visitor_latitude : 'Unavailable',
      visitor_longitude: (geoData && geoData.visitor_longitude) ? geoData.visitor_longitude : 'Unavailable',
      visitor_isp: (geoData && geoData.visitor_isp) ? geoData.visitor_isp : 'Unavailable',
      visitor_asn: (geoData && geoData.visitor_asn) ? geoData.visitor_asn : 'Unavailable',
      visitor_timezone: (geoData && geoData.visitor_timezone) ? geoData.visitor_timezone : 'Unavailable',
      submission_timestamp: nowIso,
      submission_page_url: window.location.href,
      submission_page_title: document.title,
      submission_referrer: document.referrer || 'Direct / Unknown',
      form_type: formType,
      submission_id: 'AARAA-' + Date.now().toString(36).toUpperCase()
    };

    for (var metaKey in submissionMeta) {
      if (submissionMeta.hasOwnProperty(metaKey) && !formData.has(metaKey)) {
        formData.append(metaKey, String(submissionMeta[metaKey]));
      }
    }

    // Determine payload to dispatch: For Contact Us enquiries, construct clean 7-field FormBold payload
    // (5 original business fields + 2 approved technical fields: visitor_ip & submission_id)
    var payloadToSend = formData;
    var isContactUsForm = formType === 'contact' || (form && (form.id === 'contactform' || form.classList.contains('form-contact-us')));

    if (isContactUsForm) {
      var contactFormData = new FormData();
      var visitorName = (formData.get('name') || formData.get('full_name') || formData.get('contact_person') || '').toString().trim();
      var visitorEmail = (formData.get('email') || '').toString().trim();
      var visitorPhone = (formData.get('phone') || formData.get('mobile') || '').toString().trim();
      var contactReason = (formData.get('leadType') || formData.get('reason') || formData.get('reason_for_contact') || 'General Inquiry').toString().trim();
      var visitorMessage = (formData.get('message') || '').toString(); // Keep exact text with newlines & special chars
      var subId = submissionMeta.submission_id;
      var clientIp = submissionMeta.visitor_ip;

      // Exactly Five Business Fields:
      contactFormData.append('name', visitorName);
      contactFormData.append('email', visitorEmail);
      contactFormData.append('phone', visitorPhone);
      contactFormData.append('reason', contactReason);
      contactFormData.append('message', visitorMessage);

      // Exactly Two Approved Technical Fields:
      contactFormData.append('visitor_ip', clientIp);
      contactFormData.append('submission_id', subId);

      // FormBold System Routing Headers (envelope only, FormBold never renders '_' fields in email body)
      var contactSubject = 'New Contact Enquiry — ' + (visitorName || 'Visitor') + ' — [' + subId + ']';
      contactFormData.append('_subject', contactSubject);
      if (visitorEmail) contactFormData.append('_replyto', visitorEmail);
      if (visitorName) contactFormData.append('_name', visitorName);

      payloadToSend = contactFormData;

      // Non-blocking local backup dispatch to /api/submit
      try {
        fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: visitorName,
            email: visitorEmail,
            phone: visitorPhone,
            reason: contactReason,
            message: visitorMessage,
            formType: 'contact',
            submission_id: subId
          })
        }).catch(function() {});
      } catch (localErr) {}
    }

    // FormBold expects data as FormData. We send all submissions as FormData.
    const fetchOptions = {
      method: 'POST',
      body: payloadToSend,
      headers: {
        'Accept': 'application/json'
      }
    };

    const response = await fetch(FORMBOLD_URL, fetchOptions);
    hideFormLoading(form);

    let result = {};
    if (response.ok) {
      result = await response.json();
    } else {
      let errorMsg = "Failed to process form submission.";
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch (parseErr) {
        const text = await response.text();
        errorMsg = text || errorMsg;
      }
      throw new Error(errorMsg);
    }

    form.dispatchEvent(new CustomEvent(`${formType}-form-success`,  { detail: result }));
    form.dispatchEvent(new CustomEvent('form-submit-success',        { detail: { formType, result } }));

    // Send conversion event to Google Analytics (gtag)
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        'event_category': 'Form Submission',
        'event_label': formType,
        'value': 1.0,
        'currency': 'INR',
        'form_id': form.id || 'unknown_form',
        'page_title': document.title
      });
    }

    const successMsg = "Your submission has been received successfully.";

    if (window.AaraaModals && typeof window.AaraaModals.showToast === 'function') {
      window.AaraaModals.showToast('success', 'Submitted Successfully!', successMsg);
    } else {
      alert(`✅ ${successMsg}`);
    }

    form.reset();
    form.querySelectorAll('.file-selected-name').forEach(el => el.style.display = 'none');
    if (window.AaraaModals && typeof window.AaraaModals.closeActiveModal === 'function') setTimeout(() => window.AaraaModals.closeActiveModal(), 2000);
    ['closeEnquiry', 'closePopup', 'closeEnquiryModal'].forEach(fn => { if (typeof window[fn] === 'function') window[fn](); });

  } catch (submitErr) {
    hideFormLoading(form);
    console.error("Submission failed:", submitErr);
    form.dispatchEvent(new CustomEvent(`${formType}-form-error`,  { detail: { error: submitErr.message } }));
    form.dispatchEvent(new CustomEvent('form-submit-error',        { detail: { formType, error: submitErr.message } }));
    if (window.AaraaModals && typeof window.AaraaModals.showToast === 'function') window.AaraaModals.showToast('error', 'Submission Failed', submitErr.message);
    else alert("Submission Failed: " + submitErr.message);
  }
}

window.__aaraaFirebaseHandler = function(e) { handleFormSubmit(e); };

document.addEventListener('DOMContentLoaded', () => {
  loadConfigAndInitTurnstile();
  startTurnstileDaemon();
  // Also hook into modal open actions to re-trigger rendering if a modal opens
  document.querySelectorAll('[onclick*="openPopup"], [onclick*="openEnquiry"], [data-aaraa-enquiry], [data-aaraa-vendor], .js-open-apply').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(renderAllTurnstiles, 300);
    });
  });

  // Global click listener to catch any other modal opens dynamically
  document.addEventListener('click', () => {
    setTimeout(renderAllTurnstiles, 300);
  });
  if (window.__firebaseSubmitEventListenersBound) return;
  window.__firebaseSubmitEventListenersBound = true;

  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const nameEl = e.target.closest('.file-upload-wrapper')?.querySelector('.file-selected-name') || document.getElementById(`${e.target.name}-selected`);
      if (nameEl) {
        nameEl.innerText = file ? `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : '';
        nameEl.style.display = file ? 'block' : 'none';
      }
    });
  });

  document.querySelectorAll('form[data-form-type]').forEach(form => {
    if (form.dataset.formHandler === 'aaraa' || form.closest('.ai-modal-box')) return;
    form.addEventListener('submit', handleFormSubmit);
  });

  ['contactform', 'contactForm', 'callbackForm', 'callbackform', 'callmeBackForm', 'leadForm', 'leadform'].forEach(id => {
    const form = document.getElementById(id);
    if (form && !form.dataset.formType) {
      form.dataset.formType = id.toLowerCase().includes('callback') ? 'callback' : 
                              id.toLowerCase().includes('lead') ? 'enquiry' : 'contact';
      if (!(form.dataset.formHandler === 'aaraa' || form.closest('.ai-modal-box'))) form.addEventListener('submit', handleFormSubmit);
    }
  });

  [
    { ids: ['quickform', 'quickEnquiryForm', 'enquiryForm', 'emailform'], type: 'enquiry' },
    { ids: ['vendorForm'], type: 'vendor' }
  ].forEach(({ ids, type }) => {
    ids.forEach(id => {
      const form = document.getElementById(id);
      if (form && !form.dataset.formType) {
        form.dataset.formType = type;
        if (!(form.dataset.formHandler === 'aaraa' || form.closest('.ai-modal-box'))) {
          const fresh = form.cloneNode(true);
          form.parentNode.replaceChild(fresh, form);
          fresh.dataset.formType = type;
          fresh.addEventListener('submit', handleFormSubmit);
        }
      }
    });
  });
});
