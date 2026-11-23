# Security Gap Register & Remediation Blueprint

**Project:** AARAA Infrastructure Next.js Website  
**Date:** 20 November 2026  
**Auditor:** Senior Security Engineer & Full-Stack Architect  
**Review Status:** Verification & Recommendations (Pending Management Approval)  

---

## 1. Executive Summary

This register formally documents the five outstanding technical security gaps identified during the comprehensive website audit. Each item is classified by risk, implementation complexity, current state, recommended technical architecture, and potential operational impact.

> [!IMPORTANT]
> In accordance with production stability instructions, no production security headers or API validation rules have been unilaterally altered. Implementation requires review and formal management approval.

---

## 2. Security Gap Analysis Matrix

| # | Vulnerability / Gap Domain | Priority | Risk Level | Current State | Potential Operational Impact | Recommended Action |
|---|---|---|---|---|---|---|
| **GAP-01** | Content Security Policy (CSP) | **Medium** | Low–Medium | Missing in `next.config.mjs` | **High** (Risk of breaking inline styles/scripts if misconfigured) | Stage with `Content-Security-Policy-Report-Only` first |
| **GAP-02** | API Rate Limiting | **High** | Medium–High | Absent on all 4 API routes | **Low** (Protects SMTP quota & prevents bot spam) | Implement IP sliding-window limiter |
| **GAP-03** | Upload MIME-Type Validation | **High** | Medium | Relies solely on client `file.type` | **Low** (Transparent to legitimate users) | Enforce strict server-side extension whitelist |
| **GAP-04** | File Magic-Number Verification | **Medium** | Medium | Header bytes uninspected | **Low** (Transparent to legitimate users) | Verify file binary signatures (`%PDF-`, etc.) |
| **GAP-05** | Upload File Size Enforcement | **High** | Medium–High | No explicit early size guard | **Low** (Protects Node memory & serverless execution) | Reject files > 5MB before buffer allocation |

---

## 3. Detailed Gap Investigations

### GAP-01: Content Security Policy (CSP)
- **Current Implementation:** `next.config.mjs` enforces `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and `Referrer-Policy`. However, no `Content-Security-Policy` header is declared.
- **Existing Risk:** The application relies on external resources (Google Fonts, Google Maps embeds, GSAP animations, CDN scripts). In the absence of a CSP, if malicious markup or cross-site scripting were injected via third-party widgets, the browser would not restrict unauthorized external script execution or data exfiltration.
- **Recommended Fix:** Implement a staged Content Security Policy in `next.config.mjs`:
  ```javascript
  // Stage 1: Report-Only mode (Monitor without breaking)
  {
    key: 'Content-Security-Policy-Report-Only',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-src 'self' https://www.google.com https://maps.google.com;"
  }
  ```
- **Priority:** Medium.
- **Potential Impact:** High if deployed in enforcing mode prematurely. Inline scripts in legacy pages (e.g. jQuery sliders, counter animations) could be blocked. **Mandatory testing in Report-Only mode required.**

---

### GAP-02: API Rate Limiting
- **Current Implementation:** Endpoints (`/api/submit`, `/api/vendor`, `/api/careers/apply`) accept requests without rate throttling or client IP tracking.
- **Existing Risk:** Form spam bots can launch denial-of-wallet / denial-of-service attacks by triggering thousands of Nodemailer SMTP email dispatches in seconds. This risks exhausting Google Workspace / Zoho SMTP daily email sending quotas and blacklisting company IP domains.
- **Recommended Fix:** Add an Edge/Node rate limiting middleware using an in-memory sliding window or Redis store (e.g., Upstash / memory token bucket), capping form submissions to:
  - Max 5 requests per 10-minute window per IP address for contact/vendor forms.
  - Max 3 requests per 30-minute window per IP for career resume uploads.
- **Priority:** High.
- **Potential Impact:** Minimal risk to legitimate users; immediate protection against automated spam attacks.

---

### GAP-03: Upload MIME-Type Validation
- **Current Implementation:** `app/api/careers/apply/route.js` and `app/api/vendor/route.js` extract the uploaded file from `FormData` and check the client-provided `file.type`.
- **Existing Risk:** The client-supplied `Content-Type` is entirely user-controlled and can be trivial to spoof (e.g., an executable `.exe`, `.bat`, or `.php` file sent with `Content-Type: application/pdf`). While files are forwarded via email rather than executed on the web server, company HR and procurement personnel receiving these emails could open infected attachments.
- **Recommended Fix:** Enforce a strict server-side whitelist validating that both the file extension and the MIME type match permitted document types:
  ```javascript
  const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
  const ALLOWED_MIMES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  ```
- **Priority:** High.
- **Potential Impact:** Zero negative impact on legitimate applicants; eliminates malicious file masquerading.

---

### GAP-04: File Magic-Number (Binary Signature) Verification
- **Current Implementation:** Header bytes of uploaded buffers are not inspected before processing.
- **Existing Risk:** Attackers can rename an executable file to `resume.pdf` to bypass extension checks.
- **Recommended Fix:** Inspect the initial bytes of the file buffer in memory prior to attachment:
  - PDF: Starts with `%PDF-` (`0x25 0x50 0x44 0x46`).
  - Word (.doc legacy): Starts with `0xD0 0xCF 0x11 0xE0`.
  - Word (.docx OOXML): Starts with `0x50 0x4B 0x03 0x04` (PK zip container).
- **Priority:** Medium.
- **Potential Impact:** Zero negative impact on authentic documents.

---

### GAP-05: Upload File Size Enforcement
- **Current Implementation:** Server-side file size is not guarded prior to reading full file buffers into memory.
- **Existing Risk:** Users uploading massive files (e.g. 50MB – 100MB videos or architectural CAD models) can trigger Node.js memory bloat or serverless function execution timeouts (Vercel payload limits are 4.5MB on hobby/standard tiers).
- **Recommended Fix:** Programmatically check `file.size` before arrayBuffer conversion:
  ```javascript
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File size exceeds maximum permitted limit (5MB).' }, { status: 413 });
  }
  ```
- **Priority:** High.
- **Potential Impact:** Low impact, prevents out-of-memory errors and maintains compliance with serverless infrastructure limits.

---

## 4. Remediation Governance & Approval Checklist

| Action Item | Responsible Role | Implementation Window | Approval Status |
|---|---|---|---|
| Implement File Size (5MB) & Extension Whitelist in API routes | Full-Stack Engineer | Sprint 1 | **Requires Management Approval** |
| Implement Buffer Binary Magic-Number Check | Security Specialist | Sprint 1 | **Requires Management Approval** |
| Implement IP-based Sliding Window Rate Limiting on APIs | Full-Stack Engineer | Sprint 1 | **Requires Management Approval** |
| Deploy `Content-Security-Policy-Report-Only` header | DevOps / Architect | Sprint 2 | **Requires Management Approval** |
| Review CSP violation reports & promote to Enforcing CSP | Security Specialist | Sprint 3 | **Requires Management Approval** |
