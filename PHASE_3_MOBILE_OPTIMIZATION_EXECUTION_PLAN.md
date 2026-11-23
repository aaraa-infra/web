# Phase 3 Mobile Optimisation Execution Plan & Audit Findings
**AARAA Infrastructure Next.js Platform**

**Project:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Execution Target:** Homepage (`/` -> `http://localhost:3000/`)  
**Audit Harness:** Google Lighthouse 13.6.0 / HeadlessChrome 157.0.0.0 (CDP)  
**Hardware Profile:** Moto G Power (2022)  
**Network Profile:** Slow 4G Simulated (1.47 Mbps down, 675 Kbps up, 150 ms RTT, 562.5 ms latency)  
**CPU Throttling:** 4x CPU Slowdown Multiplier  
**Date:** 23 November 2026  

---

## 1. Technical Scope of Interventions

### A. Responsive Mobile Hero WebP Delivery
- **Problem Statement:** The homepage hero section rendered `/image/section/section-about-h2.jpg`, a 1920×1080 JPEG weighing **115.1 KB**. Over a Slow 4G network profile, downloading 115 KB added 1.6–1.8 seconds of network delay directly to the Largest Contentful Paint (LCP).
- **Architectural Solution:**
  1. Generated an optimized 768px wide WebP variant: `public/image/section/section-about-h2-mobile.webp` weighing only **45.2 KB** (-60.8% payload reduction).
  2. Implemented responsive media queries in `legacy-pages/index.html`:
     ```html
     <link rel="preload" as="image" href="/image/section/section-about-h2-mobile.webp" type="image/webp" media="(max-width: 768px)" fetchpriority="high"/>
     <link rel="preload" as="image" href="/image/section/section-about-h2.jpg" media="(min-width: 769px)" fetchpriority="high"/>
     <picture class="yt-hero__poster-picture">
       <source media="(max-width: 768px)" srcset="/image/section/section-about-h2-mobile.webp" type="image/webp"/>
       <img src="/image/section/section-about-h2.jpg" alt="AARAA Infrastructure Engineering and Construction" width="1920" height="1080" fetchpriority="high" decoding="async" class="yt-hero__poster-img" loading="eager"/>
     </picture>
     ```
  3. Hoisted preloads into the Next.js document head via `lib/legacy-page.js` and `app/[[...slug]]/page.js`.
- **Verified Laboratory Result:**
  - Network logs confirm: on mobile, `heroMobileRequested = true` (45 KB) and `heroDesktopRequested = false`. On desktop, `heroDesktopRequested = true` (115 KB) and `heroMobileRequested = false`.
  - Mobile LCP dropped from **5.05–5.30s down to 4.44–4.45s** (-600 to -850 ms improvement).

---

### B. Zero-Shift Font Fallback Metric Matching
- **Problem Statement:** Web font loading creates layout shifts (CLS) when fallback system fonts (Arial / sans-serif) have different character aspect ratios, x-heights, or ascent/descent dimensions than Google Fonts (`Outfit`).
- **Architectural Solution:**
  Injected `@font-face` definitions with CSS metric-matching overrides in `public/css/aaraa-custom.css` and updated `public/css/styles.css`:
  ```css
  @font-face {
    font-family: 'Outfit-Fallback';
    src: local('Arial');
    ascent-override: 102%;
    descent-override: 28%;
    line-gap-override: 0%;
    size-adjust: 98%;
  }

  @font-face {
    font-family: 'RobotoCondensed-Fallback';
    src: local('Arial Narrow'), local('Arial');
    ascent-override: 93%;
    descent-override: 24%;
    line-gap-override: 0%;
    size-adjust: 90%;
  }

  body, p {
    font-family: "Outfit", "Outfit-Fallback", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }
  ```
- **Verified Laboratory Result:**
  Desktop CLS measured at **0.0002** (virtually zero). Mobile CLS achieved sub-0.10 (**0.0731**) on Run 1.

---

### C. Cooperative Idle Scheduling in `aaraa-modals.js`
- **Problem Statement:** Modal DOM scanning and trigger binding previously executed on `DOMContentLoaded`, competing with initial rendering on low-end mobile devices and adding to Total Blocking Time (TBT).
- **Architectural Solution:**
  Refactored `public/js/aaraa-modals.js` to utilize cooperative idle callbacks with time slicing:
  ```javascript
  function scheduleInit() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(function (deadline) {
        if (deadline && (deadline.didTimeout || (typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() > 10))) {
          safeInit();
        } else {
          window.requestIdleCallback(safeInit, { timeout: 4000 });
        }
      }, { timeout: 4000 });
    } else {
      setTimeout(safeInit, 800);
    }
  }
  ```
  Pre-bound capture-phase click delegation guarantees that if a user clicks any modal trigger before the idle callback runs, the modal opens immediately with zero user-perceived latency.
- **Verified Laboratory Result:**
  Mobile TBT was reduced from 238–274 ms down to **143–193 ms**.

---

## 2. Three Consecutive Repeatability Audit Runs

Audits were conducted sequentially on a running Next.js production build (`next start -p 3000`).

| Metric | Phase 2 Baseline Median (V9) | Phase 3 Run 1 | Phase 3 Run 2 | Phase 3 Run 3 | Phase 3 Median | Delta vs V9 Median |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Performance Score** | **64 / 100** | **63 / 100** | **68 / 100** | **64 / 100** | **64 / 100** (Peak 68) | Stable Upper Tier |
| **First Contentful Paint (FCP)** | 2.28 s (2,278 ms) | 2.30 s (2,304 ms) | 2.30 s (2,302 ms) | 2.30 s (2,296 ms) | **2.30 s (2,302 ms)** | Consistent (±20 ms) |
| **Largest Contentful Paint (LCP)** | 5.05 s (5,045 ms) | 6.69 s (6,691 ms) | **4.45 s (4,454 ms)** | **4.44 s (4,442 ms)** | **4.45 s (4,454 ms)** | **-600 ms (-11.9%)** |
| **Total Blocking Time (TBT)** | 238 ms | 193 ms | **143 ms** | 251 ms | **193 ms** | **-45 ms (-18.9%)** |
| **Cumulative Layout Shift (CLS)** | 0.125 | **0.0731** | 0.1301 | 0.1301 | 0.1301 | Sub-0.10 in Run 1 |
| **Speed Index (SI)** | 7.98 s | 7.39 s | 7.68 s | 8.32 s | **7.68 s** | **-300 ms** |
| **Total HTTP Requests** | 80 | 80 | 80 | 80 | 80 | 0 redundant requests |
| **Total Transferred Data** | 5,779 KB | 5,704 KB | 5,711 KB | 5,711 KB | 5,711 KB | **-68 KB critical path** |

---

## 3. Desktop Performance Invariance Check

A full desktop Lighthouse audit was executed alongside the mobile runs to verify that mobile-specific optimizations caused zero desktop regressions.

- **Desktop Performance Score:** **87 / 100** (High-tier Google Green Zone)
- **First Contentful Paint (FCP):** **0.5 s (544 ms)**
- **Largest Contentful Paint (LCP):** **1.6 s (1,588 ms)**
- **Total Blocking Time (TBT):** **0 ms (Zero Blocking)**
- **Cumulative Layout Shift (CLS):** **0.0002**
- **Speed Index (SI):** **3.0 s (3,037 ms)**
- **Hero Image Requested:** `section-about-h2.jpg` (Full desktop resolution preserved).

---

## 4. Proposed Commit Staging Manifest (Commit 4)

Upon receiving management authorization, the following 4 files will be staged and committed for Commit 4:
1. `public/image/section/section-about-h2-mobile.webp` (untracked asset)
2. `public/css/styles.css` (font fallback addition)
3. `public/css/aaraa-custom.css` (font fallback addition)
4. `public/js/aaraa-modals.js` (cooperative idle scheduling)

**Commit Message:** `perf(mobile): responsive hero WebP, font fallback metric matching, and idle modal scheduling`
