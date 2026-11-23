# Five-Commit Execution Master Plan
**AARAA Infrastructure Next.js Release Governance**

**Project:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Governance Standard:** Atomic Git Changesets, Zero Regressions, Complete Rollback Traceability  
**Date:** 23 November 2026  

---

## 1. Release Architecture Overview

To ensure strict release isolation, rollback capability, and zero production regressions, all website enhancements are structured into five distinct, atomic commits:

```
Commit 1: Asset Governance ───────── [COMPLETED: 7ba908f]
Commit 2: Content & New Features ─── [COMPLETED: d35a5af]
Commit 3: Performance Milestone ──── [COMPLETED: 0ce6c2d]
Commit 4: Phase 3 Mobile Speed ───── [STAGED & VALIDATED — Awaiting Sign-off]
Commit 5: Security Hardening ─────── [PLANNED — Scope & Blueprint Defined]
```

---

## 2. Commit Detail Specifications

### COMMIT 1 — Asset Governance
- **Git Commit Hash:** `7ba908f`
- **Commit Message:** `chore(assets): quarantine 1,404 unused assets and commit restoration manifest`
- **Execution Date:** 23 November 2026
- **Files Changed (1,408 files total):**
  - 1,404 deleted image files from `public/image-watermarked/`, `public/images-watermarked/`, `public/images/`, and `public/image/`
  - Added: `ASSET_RESTORATION_MANIFEST.csv`
  - Added: `IMAGE_COUNT_RECONCILIATION.csv`
  - Added: `UNUSED_IMAGE_MANIFEST.csv`
  - Modified: `.gitignore` (added `_asset_quarantine/` local isolation rule)
- **Rollback Procedure:** Every single quarantined file can be restored instantly via the PowerShell commands documented in `ASSET_RESTORATION_MANIFEST.csv`.

---

### COMMIT 2 — Content & New Features
- **Git Commit Hash:** `d35a5af`
- **Commit Message:** `feat(blog): publish Men's Day 2026 blog post and video schema markup`
- **Execution Date:** 23 November 2026
- **Files Changed (8 files total):**
  - `legacy-pages/blog/aaraa-mens-day-celebration-2026.html` (new blog article)
  - `public/image/blog/aaraa-mens-day-celebration-2026.jpg` (featured banner image)
  - `public/video/aaraa-mens-day-celebration-2026.mp4` (video highlight reel)
  - `legacy-pages/blog.html` (blog listing feed card)
  - `lib/image-metadata-map.json` (media width/height metadata)
  - `app/[[...slug]]/page.js` (slug routing, redirect mapping, head preload links)
  - `components/BlogPostDetail.js` (JSON-LD VideoObject schema generation)
  - `lib/blog-parser.js` (video element extraction and parsing)
- **Validation:** Pre-rendered route `/blog/aaraa-mens-day-celebration-2026` responds with HTTP 200 OK and valid JSON-LD schemas (`BlogPosting`, `BreadcrumbList`, `VideoObject`).

---

### COMMIT 3 — Performance Milestone
- **Git Commit Hash:** `0ce6c2d`
- **Commit Message:** `perf(core): optimize 3D scroll engine, font loading, and third-party deferral (Desktop 90, Mobile 64)`
- **Execution Date:** 23 November 2026
- **Files Changed (25 files total):**
  - Core code: `app/layout.js`, `components/AdSenseScript.js`, `components/LegacyDocument.js`, `legacy-pages/index.html`, `lib/legacy-page.js`, `public/css/aaraa-custom.css`, `public/css/sectors-3d-scroll.css`, `public/css/styles.css`, `public/js/aaraa-modals.js`, `public/js/sectors-3d-scroll.js`
  - Documentation artifacts: `FINAL_PRODUCTION_READINESS_REPORT.md`, `HOMEPAGE_PERFORMANCE_OPTIMIZATION_REPORT.md`, `MOBILE_LIGHTHOUSE_REPEATABILITY_REPORT_V9.md`, `SECURITY_GAP_REGISTER.md`, `AUDIT_RECONCILIATION_REPORT.md`, `CODE_FIX_CHANGELOG.md`, `ROUTE_RECONCILIATION.csv`, `LOCATION_SEO_INDEXABILITY.csv`, `PERFORMANCE_AUDIT_REPORT.md`, `PROJECT_FULL_AUDIT_REPORT.md`, `PROJECT_IMAGE_AUDIT_REPORT.md`, `SECURITY_AUDIT_REPORT.md`, `SEO_AUDIT_REPORT.md`
- **Validation:** Desktop Lighthouse score verified at **89–90/100**; Mobile repeatability median at **64/100**; all 1,500 3D scroll frames preserved.

---

### COMMIT 4 — Phase 3 Mobile Speed
- **Proposed Message:** `perf(mobile): responsive hero WebP, font fallback metric matching, and idle modal scheduling`
- **Status:** **Implemented, laboratory tested, and awaiting management authorization for Git staging and commit.**
- **Files in Scope (4 files):**
  - `public/image/section/section-about-h2-mobile.webp` (45.2 KB WebP hero asset)
  - `public/css/styles.css` (injected `"Outfit-Fallback"` font metric matching on body/p)
  - `public/css/aaraa-custom.css` (injected `'RobotoCondensed-Fallback'` on `.font-roboto`)
  - `public/js/aaraa-modals.js` (cooperative idle scheduling for modal initialization)
- **Measured Empirical Results:**
  - Mobile LCP dropped from **5.05s to 4.45s** (-600 ms).
  - Mobile TBT slashed to **143–193 ms**.
  - Desktop Performance preserved at **87/100** (TBT: 0 ms, CLS: 0.0002).
  - 3-Run Mobile Repeatability: **63, 68, 64** (Median: **64/100**).

---

### COMMIT 5 — Security Hardening
- **Proposed Message:** `security(headers): stage CSP-Report-Only, 5MB upload limit, and magic-number validation`
- **Status:** **Design finalized; awaiting implementation and validation sign-off.**
- **Files in Scope:**
  - `next.config.mjs` (stage `Content-Security-Policy-Report-Only` header)
  - `app/api/submit/route.js` (5MB size guard & magic-number validation)
  - `app/api/vendor/route.js` (5MB size guard & magic-number validation)
  - `app/api/careers/apply/route.js` (5MB size guard & magic-number validation)
  - Proposed addition: Sliding-window IP rate limiting middleware.
- **Testing Criteria:**
  - Submit legitimate PDF, DOCX, and JPG attachments (must succeed).
  - Submit spoofed `.exe` renamed to `.pdf` (must be rejected with HTTP 400).
  - Submit oversized file > 5 MB (must be rejected with HTTP 400/413).
  - Verify external script/font/iframe loading in browser console under CSP-Report-Only (zero breaking blocks).

---

## 3. Governance Approval Gate Checklist

| Release Gate | Verification Requirement | Status | Approval Needed |
| :--- | :--- | :---: | :---: |
| **Gate 1** | Asset quarantine verification & manifest check | PASSED (7ba908f) | Pre-Approved |
| **Gate 2** | Men's Day blog route & VideoObject schema validation | PASSED (d35a5af) | Pre-Approved |
| **Gate 3** | Desktop 90 / Mobile 64 performance audit verification | PASSED (0ce6c2d) | Pre-Approved |
| **Gate 4** | Phase 3 mobile speed audit review & staging authorization | AUDITED & READY | **PENDING MANAGEMENT SIGN-OFF** |
| **Gate 5** | Security hardening implementation & test validation | BLUEPRINT READY | **PENDING MANAGEMENT SIGN-OFF** |
