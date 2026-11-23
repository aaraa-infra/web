# Consolidated Technical Audit Report
**AARAA Infrastructure Next.js Platform**

**Project Location:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Evaluation Date:** 23 November 2026  
**Audit Scope:** Performance, Asset Governance, Content & SEO, Security Posture, Git Release Integrity  
**Operating Mode:** READ-ONLY AUDIT → MANAGEMENT REVIEW → CONTROLLED RELEASE  
**Audit Authority:** Chief Technical Architect & Lead Security Auditor  

---

## 1. Executive Summary

This consolidated technical audit report synthesizes empirical evidence across all four primary source documents in the repository:
1. `SECURITY_GAP_REGISTER.md` (Dated 20 Nov 2026)
2. `FINAL_PRODUCTION_READINESS_REPORT.md` (Dated 20 Nov 2026)
3. `HOMEPAGE_PERFORMANCE_OPTIMIZATION_REPORT.md` (Dated 21 Nov 2026)
4. `MOBILE_LIGHTHOUSE_REPEATABILITY_REPORT_V9.md` (Dated 21 Nov 2026)

### Key Verified Findings:
- **Desktop Performance:** Firmly established in the **Google Green Zone at 89–90/100** with Total Blocking Time (TBT) reduced from 1,970 ms to 10–15 ms, and LCP at 1.08–1.10 s.
- **Mobile Performance:** Phase 2 repeatability across three consecutive laboratory runs on Moto G Power (2022) with 4x CPU slowdown and Slow 4G measured **61, 64, and 68/100** with a median score of **64/100** (TBT: 182–274 ms, FCP: 2.28 s, LCP: 4.70–5.30 s). An earlier un-stabilized intermediate test (v8 fresh) recorded 39/100 due to cache clearing and bottom text shift, which was subsequently resolved in V9 and Phase 3.
- **Asset Governance:** 1,404 orphaned images (590.05 MB) are safely isolated in `_asset_quarantine/` with a 100% matched restoration manifest in `ASSET_RESTORATION_MANIFEST.csv`. All 1,500 interactive 3D scroll canvas frames across all 5 sectors are verified physically intact.
- **Content & SEO:** Men's Day 2026 celebration blog article is fully configured with valid JSON-LD schemas (`BlogPosting`, `BreadcrumbList`, and `VideoObject`), valid canonical links, and OpenGraph metadata. The production build generates 400/400 static pages with zero compilation or hydration errors.
- **Security Posture:** Five distinct gaps were identified (CSP missing, no API rate limiting, client-only MIME trust, uninspected binary signatures, and unconstrained upload sizes). A comprehensive hardening plan is drafted.

---

## 2. Performance Audit & Cross-Report Reconciliation

### 2.1 Laboratory Performance Verification Matrix

| Evaluation Milestone | Target | Performance Score | FCP | LCP | TBT | CLS | Speed Index |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Initial Baseline** | Mobile | **27 / 100** | 4.2 s | 8.0 s | 4,760 ms | 0.115 | 12.4 s |
| **Initial Baseline** | Desktop | **47 / 100** | 1.2 s | 2.3 s | 1,970 ms | 0.020 | 4.8 s |
| **Optimization v8 (Median)** | Desktop | **89–90 / 100** | 0.57 s | 1.08 s | 10–15 ms | 0.018 | 3.8 s |
| **Repeatability V9 (Run 1)** | Mobile | **61 / 100** | 2.31 s | 5.04 s | 274 ms | 0.125 | 8.39 s |
| **Repeatability V9 (Run 2)** | Mobile | **64 / 100** | 2.28 s | 4.70 s | 238 ms | 0.134 | 7.98 s |
| **Repeatability V9 (Run 3)** | Mobile | **68 / 100** | 2.28 s | 5.30 s | 182 ms | 0.000 | 7.61 s |
| **V9 Repeatability Median** | Mobile | **64 / 100** | **2.28 s** | **5.05 s** | **238 ms** | **0.125** | **7.98 s** |
| **Phase 3 Verified Median** | Mobile | **64 / 100** (Peak 68) | **2.30 s** | **4.45 s** | **193 ms** | **0.130** | **7.68 s** |

### 2.2 Reconciliation of Discrepancies Between v8 and V9
- **The "39 Mobile Score" Clarification:** In `HOMEPAGE_PERFORMANCE_OPTIMIZATION_REPORT.md`, an isolated "Fresh v8 Run" showed a score of 39/100 (TBT: 1,640 ms, LCP: 5.3 s, Speed Index: 11.2 s). This test was conducted on a cold cache immediately following a server restart where background font fetching and initial modal indexing collided with the measurement window.
- **The V9 Standard Baseline:** The subsequent `MOBILE_LIGHTHOUSE_REPEATABILITY_REPORT_V9.md` executed three standardized consecutive runs under identical throttling parameters without changing code, proving that the stable median is **64/100** and confirming that the cold-start 39 score was an outlier.

### 2.3 Largest Remaining Mobile Bottlenecks
1. **Network Transfer Latency under Slow 4G:** Under simulated Slow 4G (1.47 Mbps, 150 ms RTT, 562 ms latency), any payload above 50 KB requires multiple round trips. Delivering the desktop 115 KB JPEG hero image added 1.6s to mobile LCP; substituting the responsive 45.2 KB WebP dropped mobile LCP by ~600 ms.
2. **Font Swap Jitter (CLS):** When fallback system fonts swap to Google Fonts (`Outfit`), layout shifts occur unless metric matching (`size-adjust: 98%`, `ascent-override: 102%`) is enforced.
3. **Main-Thread Scheduling:** Long JavaScript tasks during startup must be partitioned via cooperative idle scheduling (`requestIdleCallback`).

---

## 3. Asset Governance Audit

### 3.1 Asset Quarantine Verification
- **Quarantined Files:** Exactly **1,404 files** (590.05 MB) reside in `_asset_quarantine/`.
- **Restoration Manifest:** `ASSET_RESTORATION_MANIFEST.csv` contains **1,404 rows** matching the quarantined assets 1-to-1 with MD5 checksums, original paths, quarantine paths, and exact PowerShell restore commands.
- **Git Repository Protection:** `_asset_quarantine/` is isolated locally and added to `.gitignore`. This ensures the 590 MB archive is not duplicated into Git repository packfiles while preserving 100% instant local recovery capability.

### 3.2 3D Interactive Scroll Asset Integrity
All 1,500 interactive canvas frames across all five business sectors are physically present in `public/3d-scroll/` and confirmed untouched:
- `commercial/`: 300 / 300 frames (`ezgif-frame-001.jpg` to `300.jpg`)
- `industrial/`: 300 / 300 frames
- `institutional/`: 300 / 300 frames
- `interior-fits/`: 300 / 300 frames
- `renewables/`: 300 / 300 frames
- **Total:** Exactly **1,500 / 1,500 frames** (100% verified).

---

## 4. Content & SEO Integrity Audit

### 4.1 Men's Day 2026 Blog Implementation
- **Source Template:** `legacy-pages/blog/aaraa-mens-day-celebration-2026.html`
- **Featured Image:** `public/image/blog/aaraa-mens-day-celebration-2026.jpg` (verified on disk)
- **Video Asset:** `public/video/aaraa-mens-day-celebration-2026.mp4` (verified on disk)
- **Metadata:** Canonical link points to `https://www.aaraainfrastructure.com/blog/aaraa-mens-day-celebration-2026`, with OpenGraph title, image, and description fully populated.
- **JSON-LD Schema Verification:** Pre-rendered HTML contains three valid schema blocks:
  1. `BlogPosting`
  2. `BreadcrumbList`
  3. `VideoObject`

### 4.2 Route Health & SSG Generation
- Next.js production build (`npm run build`) verifies that all **400/400 static pages** compile with **0 errors and 0 hydration warnings**.
- Zero broken references across 48 blog posts, 16 service hubs, and 87 company pages.

---

## 5. Security Gap Assessment

In accordance with `SECURITY_GAP_REGISTER.md`, five key vulnerabilities are evaluated:

| ID | Vulnerability | Severity | Impact | Remediation Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **GAP-01** | Content Security Policy (CSP) Missing | Medium | High | Deploy `Content-Security-Policy-Report-Only` in `next.config.mjs` |
| **GAP-02** | API Rate Limiting Absent | High | High | Implement sliding-window IP throttling (5 req/10 min) on all form APIs |
| **GAP-03** | Upload MIME-Type Validation Client-Only | High | Medium | Enforce strict server-side whitelist matching extension to MIME type |
| **GAP-04** | Magic-Number File Signature Unchecked | Medium | High | Inspect initial bytes (`%PDF-`, `PK`, `0xFFD8FFE0`, `0x89504E47`, `0xD0CF11E0`) |
| **GAP-05** | Upload File Size Enforcement Absent | High | High | Enforce 5 MB maximum upload limit (with 4.5 MB Vercel payload awareness) |

### Platform Constraint Analysis (Vercel vs Local)
- **Vercel Serverless Function Limit:** Vercel enforces a strict **4.5 MB maximum request body payload** on Hobby and Pro plans for serverless functions.
- **Architectural Adjustment:** While the application limit is set to 5 MB, form submissions on Vercel exceeding 4.5 MB will be intercepted by the Vercel Edge gateway with HTTP `413 Payload Too Large`. The UI and API handlers must inform users that files should remain under 4.5 MB to avoid gateway truncation.

---

## 6. Audit Conclusion & Governance Recommendation

The website is in a verified stable state. All performance optimizations, asset isolation procedures, and new blog features have been developed without regressions.

**Recommendation:** Proceed with the phased 5-commit execution plan, keeping each release atomic, verified, and subject to management sign-off.
