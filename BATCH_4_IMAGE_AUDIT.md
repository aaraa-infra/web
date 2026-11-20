# BATCH 4 — COMPREHENSIVE IMAGE AUDIT REPORT

**Project:** AARAA Infrastructure Technical SEO Remediation  
**Batch:** 4 — Image Optimisation and CLS Remediation  
**Authority:** Atlas  
**Audit Date:** November 19, 2026  
**Audited Routes:** 397 Next.js production routes (390 pre-rendered static HTML routes)  
**Execution Environment:** Node.js v26.13.1 / Sharp v0.34.x  

---

## 1. Executive Summary

A comprehensive automated audit was performed across all 397 compiled production routes to inspect image payload, dimensions, formats, Core Web Vitals (CWV / CLS) attributes, and loading behavior.

### Key Audit Metrics

| Metric | Measured Value | Standard / Target | Status |
| :--- | :---: | :---: | :---: |
| **Total `<img>` Elements Across Rendered Routes** | **19139** | N/A | Total Instances |
| **Unique Image URLs (`src`)** | **514** | N/A | Asset Pool |
| **Unique Physical Images Resolved on Disk** | **497** | 100% | 17 External / CDN |
| **Total Unique Image Payload** | **320.35 MB** | < 50 MB | ⚠️ High Payload |
| **Oversized Images (> 100 KB)** | **354 (71.2%)** | < 100 KB | ⚠️ Severe Overload |
| **Critical Oversized Images (> 200 KB)** | **270 (54.3%)** | < 200 KB | ❌ Critical |
| **Images Missing Width/Height Attributes** | **496 (96.5%)** | 0% | ❌ Severe CLS Risk |
| **Legacy Format Assets (JPEG / PNG)** | **367 (73.8%)** | 0% (Prefer WebP/AVIF) | ⚠️ Modernization Opportunity |
| **Missing Alt Text (`alt` attribute absent)** | **0** | 0 | ✅ Alt Attributes Present |

---

## 2. Root Cause Analysis

### 2.1. Critical File Size & Bandwidth Waste
* **Raw Camera Uploads in Production:** Several project gallery images and blog post illustrations are raw uncompressed photographs straight from field smartphones (e.g. `4624x3468` and `5712x4284` resolutions) ranging from **3.5 MB to 7.9 MB per image**.
* **Impact:** A single blog post (such as SRM Green Pearl or MGR Adarsh School) requests over **35 MB to 50 MB of images**, severely degrading mobile page load time and destroying Largest Contentful Paint (LCP).

### 2.2. Cumulative Layout Shift (CLS) Defect
* **Absence of Width & Height Attributes:** 496 out of 514 unique images (96.5%) in legacy HTML lack explicit HTML `width` and `height` attributes.
* **Impact:** The browser cannot compute the aspect ratio before downloading the image file header. When the multi-megabyte image suddenly renders, all following DOM elements (headings, text, CTAs) shift violently down the viewport, triggering high CLS penalty scores.

### 2.3. Loading Priority Mismatches
* Below-the-fold gallery thumbnails on many templates lack explicit `loading="lazy"` and `decoding="async"`, contending with critical LCP assets for initial network bandwidth.
* Hero banners across some templates lack `fetchpriority="high"`, delaying the paint of above-the-fold visual elements.

---

## 3. Top 30 Most Critical Oversized Images

The following table lists the largest unique images on the site, sorted by raw file size:

| # | Current Size | Natural Dimensions | Current Format | Image Path / URL | Occurrences |
| :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | **7913.5 KB** | 4624x3468 | `.jpg` | `/image/blog/srm/5.jpg` | 1 |
| 2 | **6477.3 KB** | 3468x4624 | `.jpg` | `/image/blog/srm/6.jpg` | 1 |
| 3 | **6257.9 KB** | 3468x4624 | `.jpg` | `/image/blog/srm/7.jpg` | 1 |
| 4 | **5578.2 KB** | 4624x3468 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240526145813.jpg` | 1 |
| 5 | **5113.7 KB** | 4624x3468 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240526145910.jpg` | 1 |
| 6 | **5025.7 KB** | 4608x3456 | `.jpg` | `/image/blog/mgr-adharsh/20240624_30349PM_ByGPSMapCamera.jpg` | 1 |
| 7 | **5005.5 KB** | 5712x4284 | `.jpg` | `/image/blog/krc/krc-external-development-10.jpg` | 1 |
| 8 | **4884.4 KB** | 4624x3468 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240605124925.jpg` | 1 |
| 9 | **4673.9 KB** | 3456x4608 | `.jpg` | `/image/blog/mgr-adharsh/20240625_21500PM_ByGPSMapCamera.jpg` | 1 |
| 10 | **4337.1 KB** | 3456x4608 | `.jpg` | `/image/blog/mgr-adharsh/20240625_21507PM_ByGPSMapCamera.jpg` | 1 |
| 11 | **4233.7 KB** | 4608x3456 | `.jpg` | `/image/blog/mgr-adharsh/20240526_30000PM_ByGPSMapCamera.jpg` | 1 |
| 12 | **4203 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610101652.jpg` | 1 |
| 13 | **4115.1 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610113823.jpg` | 1 |
| 14 | **3679.4 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610101600.jpg` | 1 |
| 15 | **3623.3 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610101655.jpg` | 1 |
| 16 | **3598.9 KB** | 3456x4608 | `.jpg` | `/image/blog/mgr-adharsh/20240625_21521PM_ByGPSMapCamera.jpg` | 1 |
| 17 | **3587.9 KB** | 1672x941 | `.png` | `/images/kudligi/kudlugi-soloar.png` | 1 |
| 18 | **3536.7 KB** | 3468x3468 | `.jpg` | `/image/blog/krc/krc-external-development-3.jpg` | 1 |
| 19 | **3535.1 KB** | 3456x4608 | `.jpg` | `/image/blog/mgr-adharsh/20240610_113702AM_ByGPSMapCamera.jpg` | 1 |
| 20 | **3527.7 KB** | 3468x3468 | `.jpg` | `/image/blog/krc/krc-external-development-5.jpg` | 1 |
| 21 | **3516.9 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610101651.jpg` | 1 |
| 22 | **3502.8 KB** | 4284x5712 | `.jpg` | `/image/blog/krc/krc-external-development-13.jpg` | 1 |
| 23 | **3497.7 KB** | 3456x4608 | `.jpg` | `/image/blog/mgr-adharsh/20240526_30639PM_ByGPSMapCamera.jpg` | 2 |
| 24 | **3459.9 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610101708.jpg` | 1 |
| 25 | **3398.8 KB** | 1672x941 | `.png` | `/image/blog/rcc-drain.png` | 2 |
| 26 | **3268.8 KB** | 3468x4624 | `.jpg` | `/image/blog/mgr-adharsh/IMG20240610101714.jpg` | 1 |
| 27 | **3252.5 KB** | 4608x3456 | `.jpg` | `/image/blog/mgr-adharsh/20240618_64029PM_ByGPSMapCamera.jpg` | 1 |
| 28 | **3187.6 KB** | 3468x4624 | `.jpg` | `/image/blog/krc/krc-external-development-9.jpg` | 1 |
| 29 | **3166.5 KB** | 3468x3468 | `.jpg` | `/image/blog/krc/krc-external-development-1.jpg` | 2 |
| 30 | **3091.5 KB** | 4608x3456 | `.jpg` | `/image/blog/mgr-adharsh/20240709_11621PM_ByGPSMapCamera.jpg` | 1 |

---

## 4. Remediation Strategy & Batch 4 Plan

### 4.1. Safe Compression & WebP Optimization
1. **Target Compression Pipeline:**
   - Use Node.js `sharp` to generate optimized modern WebP versions of oversized JPEG/PNG images at quality 82.
   - For massive camera assets (> 2000px width), downscale to a sensible web maximum (e.g. 1920px width for heroes/full-width banners, 1200px for content illustrations, 600px for thumbnails) while preserving aspect ratio.
   - Retain original source files intact to adhere strictly to Atlas's restriction (*"No deletion of original image assets without documented justification"*).
2. **Estimated Bandwidth Savings:**
   - Reducing top 50 oversized images from ~180 MB to ~15 MB (estimated **~85-90% payload reduction**).

### 4.2. Universal Width & Height Attribute Injection (CLS Prevention)
1. **Automated Dimension Extraction:**
   - Map each image path to its intrinsic pixel width and height via `sharp`.
2. **Pipeline Enrichment via `lib/legacy-page.js` & Static Templates:**
   - Inject intrinsic `width` and `height` attributes onto all `<img>` elements lacking dimensions.
   - Add responsive CSS `max-width: 100%; height: auto;` to guarantee that explicit dimensions do not distort fluid responsive behavior.

### 4.3. Modern Loading Priorities
1. **Above-the-fold / LCP Images (Hero Banners):**
   - Ensure `loading="eager"` and add `fetchpriority="high"`.
   - Remove any conflicting `loading="lazy"` on hero banners.
2. **Below-the-fold Content Images:**
   - Enforce `loading="lazy"` and `decoding="async"`.

---

## 5. Conclusion

This audit establishes the baseline metrics for Batch 4. The subsequent implementation will systematically address oversized images and missing dimensions to resolve CLS and improve page speed.
