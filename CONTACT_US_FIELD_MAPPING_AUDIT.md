# AARAA INFRASTRUCTURE — CONTACT US FIELD MAPPING AUDIT
## Comprehensive Data Flow Inspection, Field Mapping & Notification Cleanup Analysis

**Audit Date:** 23 November 2026  
**Auditor:** Senior Next.js Architect & Application Security Engineer  
**Target Page:** `/contact-us` (`https://www.aaraainfrastructure.com/contact-us`)  
**Source File:** `legacy-pages/contact-us.html` (lines 477–527)  
**Status:** AUDIT COMPLETE — AWAITING MODIFICATION APPROVAL

---

## 1. COMPLETE DATA FLOW INSPECTION

We have traced the end-to-end data pipeline from the physical HTML form to the final email inbox:

```
[ 1. Original HTML Form ]
  legacy-pages/contact-us.html: <form id="contactform" data-form-handler="aaraa" data-form-type="contact">
      │
      ├── Input: name="name" (Full Name)
      ├── Input: name="email" (Email Address)
      ├── Input: name="phone" (Phone Number)
      ├── Select: name="leadType" (Reason for Contact)
      └── Textarea: name="message" (Your Message)
      │
      ▼ (Event: submit)
[ 2. JavaScript Modal Interceptor ]
  public/js/aaraa-modals.js: AaraaModals.handleSubmit
      │ Validates client-side constraints
      ▼ Delegates to window.__aaraaFirebaseHandler
[ 3. Submission Handler ]
  public/js/firebase-submit.js: handleFormSubmit
      │ Reads FormData(form)
      │ Injects: formType, sourceUrl, pageTitle, subject, visitor_* (11 fields), submission_* (6 fields)
      ▼ Dispatches fetch(FORMBOLD_URL, { method: 'POST', body: formData })
[ 4. FormBold Cloud Endpoint ]
  https://formbold.com/s/oYAAv
      │ FormBold receives ALL 25 fields in FormData
      ▼ FormBold formats every non-underscore field into email body
[ 5. Email Notification ]
  Sent to: aaraainfrastructure@gmail.com
  Problem: Contains 18 unwanted technical/system fields + "leadType" instead of "reason"
```

---

## 2. ROOT CAUSE ANALYSIS OF THE PREVIOUS ISSUE

Our audit identified three separate reasons why the previous notification contained excessive technical clutter and did not reflect the live form fields:

### Issue A: Field Name Divergence (`leadType` vs. `reason`)
- In `legacy-pages/contact-us.html` (line 502), the select element is named:
  ```html
  <select name="leadType" id="leadType" class="nice-select" required>
      <option value="">Select reason for contact</option>
      <option value="Vendor Inquiry">Want to Became a Vendor</option>
      <option value="Subcontractor Inquiry">Want to Became a Subcontractor</option>
      <option value="Partnership Inquiry">Want to Became a Potential Partner</option>
      <option value="General Inquiry">General Inquiry</option>
  </select>
  ```
- Because the input is named `leadType`, FormBold displays the label `leadType: ...` rather than the canonical business name `Reason: ...`.

### Issue B: Universal Metadata Dumping by `firebase-submit.js`
- `public/js/firebase-submit.js` (lines 311–315) was designed as a universal handler. For all forms, it automatically appended 17 enrichment keys:
  - `visitor_country`, `visitor_country_code`, `visitor_state`, `visitor_city`, `visitor_postal_code`
  - `visitor_latitude`, `visitor_longitude`, `visitor_isp`, `visitor_asn`, `visitor_timezone`
  - `submission_timestamp`, `submission_page_url`, `submission_page_title`, `submission_referrer`
  - `formType`, `sourceUrl`, `pageTitle`, `accept_terms`, `origin_url`, `subject`
- Since FormBold blindly formats every received field into the email notification, the email was overwhelmed with 18 technical metadata rows, obscuring the actual message.

### Issue C: Automated Test Payload vs. Live Contact Us Form
- In the earlier regression audit script (`run_final_production_audit.js`), an automated test was dispatched to `/api/submit` with mock fields (`company: 'AARAA Audit Team'`, `formType: 'Production Verification Enquiry'`).
- The live Contact Us form does not even have a `company` field. Testing through synthetic scripts caused test metadata to appear in FormBold instead of verifying the exact inputs typed into the real form.

---

## 3. CANONICAL FIELD MAPPING MATRIX (EXACTLY 7 DETAILS)

The Contact Us submission and notification must map strictly to the following 7 parameters:

| # | Original Form Label | DOM Attribute in HTML | Canonical Payload Field | Expected Value Type | Email Display Label |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | Full name | `name="name"` | `name` | String (visitor's entered name) | **Full Name** |
| **2** | Email address | `name="email"` | `email` | String (RFC 5322 email) | **Email Address** |
| **3** | Phone number | `name="phone"` | `phone` | String (10-digit mobile) | **Phone Number** |
| **4** | Select reason for contact | `name="leadType"` | `reason` | String (selected dropdown option) | **Reason for Contact** |
| **5** | Your Message | `name="message"` | `message` | String (exact multiline text) | **Message** |
| **6** | *(System Detected)* | Serverless / Geo API | `visitor_ip` | String (public IPv4/IPv6) | **Sender IP Address** |
| **7** | *(System Generated)* | Dynamic Unique ID | `submission_id` | String (`AARAA-[A-Z0-9]+`) | **Submission ID** |

### FormBold Mandatory System Headers (Not Displayed in Body Table)
- `_subject`: `New Contact Enquiry — [Visitor Name] — [Submission ID]`
- `_replyto`: `[Visitor Email]`
- `_name`: `[Visitor Name]`

### Fields Explicitly Suppressed from Contact Us Notification:
- `visitor_country` (SUPPRESSED)
- `visitor_country_code` (SUPPRESSED)
- `visitor_state` (SUPPRESSED)
- `visitor_city` (SUPPRESSED)
- `visitor_postal_code` (SUPPRESSED)
- `visitor_latitude` (SUPPRESSED)
- `visitor_longitude` (SUPPRESSED)
- `visitor_isp` (SUPPRESSED)
- `visitor_asn` (SUPPRESSED)
- `visitor_timezone` (SUPPRESSED)
- `submission_timestamp` (SUPPRESSED)
- `submission_page_url` (SUPPRESSED)
- `submission_page_title` (SUPPRESSED)
- `submission_referrer` (SUPPRESSED)
- `formType` / `form_type` (SUPPRESSED)
- `sourceUrl` / `pageTitle` (SUPPRESSED)
- `origin_url` / `accept_terms` (SUPPRESSED)
- `company` (SUPPRESSED)
- `subject` (SUPPRESSED)

---

## 4. PROPOSED FILE MODIFICATIONS

Under strict governance, **zero changes** will be made to the Contact Us UI, styles, labels, button, or validation. The changes are strictly isolated to payload construction:

### File 1: `public/js/firebase-submit.js`
- **Location:** Inside `handleFormSubmit(form)`.
- **Logic:** Add a targeted payload filter for `formType === 'contact'` or `form.id === 'contactform'`.
- **Behavior:**
  1. Extract the five canonical business fields (`name`, `email`, `phone`, `reason` from `leadType`, and `message`).
  2. Extract the two approved technical fields (`visitor_ip` and `submission_id`).
  3. Construct a clean, isolated `FormData` containing **only** these 7 fields plus `_subject`, `_replyto`, and `_name`.
  4. Preserve all 1,491 other forms on their existing behavior.

### File 2: `app/api/submit/route.js`
- **Location:** Inside `POST /api/submit`.
- **Logic:** Add matching field mapping and payload filtering when `formType === 'contact'`.
- **Behavior:**
  1. Map `fields.reason = fields.reason || fields.leadType || "General Inquiry"`.
  2. When dispatching to FormBold for a Contact Us enquiry, append **only** the 7 approved fields.
  3. If direct SMTP is invoked, render an AARAA-branded clean HTML email displaying exactly the 7 fields in a clean table.

---

## 5. PLANNED TEST VERIFICATION PROTOCOL

Following implementation, a controlled test submission will be executed with:
- **Full Name:** `AARAA Contact Test`
- **Email Address:** `test.contact@aaraainfrastructure.com`
- **Phone Number:** `9876543210`
- **Reason for Contact:** `Partnership Inquiry`
- **Message:** `This is the exact original Contact Us message verification test.`

### Expected Deliverable Email Body:
```text
Full Name: AARAA Contact Test
Email Address: test.contact@aaraainfrastructure.com
Phone Number: 9876543210
Reason for Contact: Partnership Inquiry
Message: This is the exact original Contact Us message verification test.
Sender IP Address: [Actual Visitor Public IP]
Submission ID: [Unique AARAA Reference]
```
*(Total: Exactly 7 details. Zero technical noise.)*
