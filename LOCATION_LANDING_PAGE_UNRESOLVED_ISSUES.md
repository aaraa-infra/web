# AARAA INFRASTRUCTURE — LOCATION LANDING PAGE UNRESOLVED ISSUES & FUTURE ENHANCEMENTS

**Authority:** Atlas — Technical Architecture & SEO Governance  
**Repository:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Scope:** `public/location/` and `legacy-pages/location/`  
**Date:** 19 November 2026  
**Status:** ZERO BLOCKING ISSUES — ALL CRITICAL AUDIT FINDINGS RESOLVED  

---

## 1. Resolved Critical Defects

1. **Oversized Logo Defect (RESOLVED):**
   - Eliminated the unconstrained remote asset `https://aaraainfrastructure.com/logo.png` (`662 × 267`).
   - Replaced across all 175 `public/location/` and 243 `legacy-pages/location/` files with authoritative local `/image/logo/logo-black.png` locked to **128.31px × 50px**.
2. **Hero Image 404 & Grey Fallback Defect (RESOLVED):**
   - Eliminated all broken relative links (`../../solar-infrastructure-...webp`, `../../peb-industrial-...webp`).
   - Replaced with 12 high-definition (1920×1080) photorealistic service-specific WebP heroes in `public/images/location-heroes/`.
   - Verified zero 404 errors across all 175 landing pages.

---

## 2. Non-Blocking Considerations & Future Architecture Items

The following items are recorded for post-remediation governance and do not impede production readiness:

### 2.1 State-Level Landing Pages Scope (`legacy-pages/location/`)
- During the recursive filesystem audit, 68 additional HTML files were identified in `legacy-pages/location/` covering state-level routes (e.g. `tamil-nadu`, `karnataka`, `andhra-pradesh`, `telangana`, `maharashtra`) and smaller districts (`gadag`, `kudligi`, `thoothukudi`, `tirunelveli`, `amaravati`).
- These pages utilize the older `.brand-topbar` layout rather than the dynamic `.hero-slide` layout of the 21 primary city landing pages.
- **Action Taken:** All 243 files in `legacy-pages/location/` were updated to standardize the brand logo to `/image/logo/logo-black.png` (`width="128" height="50"`).
- **Future Work:** When Atlas authorizes Phase 2 location expansion, consider standardizing these state-level templates to the primary city landing-page architecture.

### 2.2 Template Consolidation (App Router Dynamic Migration)
- Currently, 175 static HTML files reside in `public/location/`.
- **Architectural Recommendation:** In a future refactoring batch, these 175 pages can be migrated into a Next.js App Router dynamic route (`app/location/[city]/[service]/page.js`) powered by a centralized JSON dataset. This will eliminate duplicate HTML files and centralize maintenance of metadata, hero imagery, and form handlers.

### 2.3 CDN Edge Cache Invalidation
- Prior to production deployment, purge CDN edge caches for:
  - `/image/logo/logo-black.png`
  - `/images/location-heroes/*.webp`
  - `/location/*` routes
- This guarantees visitors immediately receive the updated assets without stale cache negotiation.
