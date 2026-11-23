# Security Hardening Implementation Plan & Architecture
**AARAA Infrastructure Next.js Platform**

**Project:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Security Standard:** OWASP Top 10 API Security, Defense-in-Depth, Zero-Trust File Processing  
**Date:** 23 November 2026  
**Status:** BLUEPRINT & TECHNICAL SPECIFICATION (Awaiting Management Authorization)  

---

## 1. Executive Summary & Security Objectives

This implementation plan addresses the five high-priority vulnerabilities identified in `SECURITY_GAP_REGISTER.md`:
1. **GAP-01: Content Security Policy (CSP)**
2. **GAP-02: API Rate Limiting**
3. **GAP-03: Upload MIME-Type Validation**
4. **GAP-04: File Magic-Number (Binary Signature) Verification**
5. **GAP-05: Upload File Size Enforcement**

All controls are designed to be deployed without breaking legitimate third-party services (Google Fonts, Google Tag Manager, GA4, Meta Pixel, Microsoft Clarity, Google AdSense, YouTube iframes) or authentic user submissions.

---

## 2. Technical Control Specifications

### 2.1 GAP-01: Content Security Policy (Report-Only Mode)
- **Target File:** `next.config.mjs`
- **Deployment Strategy:** Enforce `Content-Security-Policy-Report-Only` initially to monitor and log third-party asset calls without breaking existing frontend functionality.
- **Directives Specification:**
  ```javascript
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com https://connect.facebook.net https://www.youtube.com https://s.ytimg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://i.ytimg.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://googleads.g.doubleclick.net",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.clarity.ms https://c.bing.com https://connect.facebook.net",
    "media-src 'self' data: blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  ```

---

### 2.2 GAP-02: API Rate Limiting (IP Sliding-Window)
- **Target Endpoints:**
  - `/api/submit/route.js` (General enquiries & consultation)
  - `/api/vendor/route.js` (Vendor empanelment registrations)
  - `/api/careers/apply/route.js` (Job & internship applications)
- **Architecture:** Sliding-window in-memory rate limiter with automatic IP tracking and cleanup:
  - **Consultation & Vendor Endpoints:** Maximum 5 submissions per 10-minute window per IP.
  - **Career Applications:** Maximum 3 submissions per 30-minute window per IP.
- **Implementation Blueprint:**
  ```javascript
  // lib/rate-limiter.js
  const ipBuckets = new Map();

  export function checkRateLimit(ip, limit = 5, windowMs = 10 * 60 * 1000) {
    const now = Date.now();
    const cleanIp = (ip || '127.0.0.1').split(',')[0].trim();
    const timestamps = (ipBuckets.get(cleanIp) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
      return { allowed: false, retryAfterSec };
    }

    timestamps.push(now);
    ipBuckets.set(cleanIp, timestamps);
    return { allowed: true };
  }
  ```

---

### 2.3 GAP-03, 04 & 05: Deep File Upload Validation & Signature Verification

- **Target Endpoints:** `/api/submit/route.js`, `/api/vendor/route.js`, `/api/careers/apply/route.js`
- **Platform Payload Constraints:**
  - Standard Next.js serverless runtimes on Vercel enforce a **4.5 MB request body limit**.
  - We enforce a strict application-level guard of **5 MB** (`5 * 1024 * 1024` bytes) and recommend user attachments remain below 4 MB.

#### Enhanced Signature Inspection Logic:
```javascript
export function checkMagicNumber(buffer, ext) {
  if (!buffer || buffer.length < 4) return false;

  // 1. PDF Document: '%PDF-' (0x25 0x50 0x44 0x46)
  if (ext === '.pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // 2. PNG Image: '\x89PNG\r\n\x1a\n' (0x89 0x50 0x4E 0x47)
  if (ext === '.png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // 3. JPEG Image: SOI (0xFF 0xD8) + Marker (0xFF)
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // 4. DOCX / XLSX / Modern Office: PK Zip Archive (0x50 0x4B 0x03 0x04)
  if (ext === '.docx' || ext === '.xlsx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4B &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
  }

  // 5. Legacy DOC / OLE Compound File: (0xD0 0xCF 0x11 0xE0) or PK if renamed
  if (ext === '.doc') {
    const isOle = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    return isOle || isZip;
  }

  return false;
}

export function validateFileSecurity(filename, mimeType, bufferSize, buffer) {
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

  if (!allowedExtensions.includes(ext)) {
    return { valid: false, status: 400, message: `Extension ${ext} is not allowed.` };
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (bufferSize > maxSizeBytes) {
    return { valid: false, status: 413, message: 'File size exceeds maximum permitted limit (5MB).' };
  }

  if (buffer && !checkMagicNumber(buffer, ext)) {
    return { valid: false, status: 400, message: `File binary signature does not match extension ${ext}.` };
  }

  return { valid: true };
}
```

---

## 3. Comprehensive Testing Protocol

Prior to committing Commit 5, the following automated test matrix will be executed:

| Test Case | Payload Description | Expected Status | Result Criteria |
| :--- | :--- | :---: | :--- |
| **TC-SEC-01** | Authentic PDF with `%PDF-` header (1.2 MB) | HTTP 200 OK | File accepted, processed, backed up |
| **TC-SEC-02** | Authentic DOCX with `PK..` header (2.4 MB) | HTTP 200 OK | File accepted, processed |
| **TC-SEC-03** | Authentic JPEG with `FF D8 FF` header (800 KB) | HTTP 200 OK | File accepted, processed |
| **TC-SEC-04** | Executable renamed to `resume.pdf` (`MZ` header) | HTTP 400 Bad Request | Rejected: "File binary signature does not match" |
| **TC-SEC-05** | PHP script renamed to `profile.png` | HTTP 400 Bad Request | Rejected: Invalid magic number |
| **TC-SEC-06** | File size 5.2 MB (> 5 MB limit) | HTTP 413 Payload Too Large | Rejected: "File size exceeds 5MB limit" |
| **TC-SEC-07** | Rate limit probe: 6 rapid submissions from 1 IP | HTTP 429 Too Many Requests | 6th request blocked with `Retry-After` header |
| **TC-SEC-08** | Browser CSP Report-Only inspection | Console Check | 0 blocking violations, 0 broken scripts/fonts |

---

## 4. Proposed Commit Staging Manifest (Commit 5)

Upon management sign-off of the implementation:
- `next.config.mjs` (CSP-Report-Only)
- `app/api/submit/route.js` (Security validator & rate limiting)
- `app/api/vendor/route.js` (Security validator & rate limiting)
- `app/api/careers/apply/route.js` (Security validator & rate limiting)
- `SECURITY_HARDENING_REPORT.md` (Audit verification report)

**Commit Message:** `security(headers): stage CSP-Report-Only, 5MB upload limit, and magic-number validation`
