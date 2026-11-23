# SEO & Technical Crawl Audit Summary
**Target Domain:** [https://www.aaraainfrastructure.com/](https://www.aaraainfrastructure.com/)  
**Crawl Date:** November 18, 2026 | 14:46:17 IST  
**Source Data:**
- `crawl_overview.csv`
- `issues_overview_report.csv`
- `segments_overview_report_issues.csv`

---

## 1. Executive Summary & Site Health Metrics

| Metric | Crawl Value | Status & Assessment |
| :--- | :--- | :--- |
| **Total URLs Encountered** | **602 URLs** | Complete site coverage |
| **Total URLs Crawled** | **590 URLs** | 98.01% crawl success rate |
| **Internal URLs Breakdown** | **582 URLs** | 116 HTML, 438 Images, 15 JS, 2 CSS, 1 XML, 10 Unknown |
| **External URLs** | **20 URLs** | 13 HTML, 3 Images, 1 CSS, 1 Other, 2 Unknown |
| **Internal Indexable URLs** | **560 URLs (93.02%)** | Highly indexable site architecture |
| **Internal Non-Indexable URLs** | **22 URLs (3.65%)** | Utility / redirected / blocked resources |
| **Server Response Speed (TTFB)** | **96.85% under 1.0s**, 3.15% under 2.0s | Outstanding server responsiveness |
| **Crawl Depth Distribution** | **100% within $\le 3$ clicks** | Flat hierarchy: Level 0: 1, Level 1: 53, Level 2: 48, Level 3: 3 |
| **Server Errors (5xx)** | **0 URLs (0.00%)** | Zero infrastructure crashes or 500 errors |

---

## 2. High-Priority Technical Issues

These issues directly impact crawling efficiency, indexation, and PageRank distribution.

### 2.1. Internal Client Errors (4xx) — 6 URLs (1.00%)
* **Issue Type:** Critical Crawlability Issue
* **Root Cause:** Legacy or outdated internal links pointing to non-existent form URLs (`/forms/subcontractor`, `/forms/partnership`, `/forms/vendor`, `/forms/joint-venture`, `/forms/careers`, `/blog-post-5`).
* **Impact:** Broken links waste search engine crawl budget and result in immediate bounce for human visitors.
* **Remediation Status:** 
  - 301 redirects and dedicated route handlers have been implemented in the latest Next.js build.
  - Audit internal anchor tags in headers, footers, and blog cards to link directly to active pages.

### 2.2. Blocked by Robots.txt with Internal Inlinks — 10 URLs (1.66%)
* **Issue Type:** Crawl Block Warning
* **Root Cause:** Internal links exist that point to paths disallowed by `robots.txt` (e.g. `/forms/*` and `/location/*`).
* **Impact:** Search crawlers discover these links on internal pages but are blocked from crawling them, triggering crawl warnings in Google Search Console.
* **Action Required:**
  - Remove direct hyperlink references to disallowed utility routes, or modify `public/robots.txt` if those landing pages should be indexed.

### 2.3. Canonicalised URLs — 1 URL (0.95%)
* **Issue Type:** Canonical Mismatch
* **Root Cause:** An internal link points to a URL whose canonical tag points elsewhere.
* **Action Required:** Update the linking page to point directly to the destination canonical URL, avoiding an unnecessary canonical hop.

### 2.4. Pages Without Internal Outlinks (Dead Ends) — 1 URL (0.95%)
* **Issue Type:** PageRank Trap
* **Root Cause:** A standalone page contains zero outgoing internal hyperlinks.
* **Action Required:** Ensure global navigation, breadcrumbs, or a "Related Projects / Services" module is present on this page to let PageRank flow onward.

---

## 3. Medium-Priority On-Page & Architecture Opportunities

### 3.1. Page Title Length & SERP Truncation
* **Titles Over 60 Characters:** **97 URLs** (92.38% of all HTML pages)
* **Titles Over 561 Pixels:** **96 URLs** (91.43%)
* **Duplicate Page Titles:** **4 URLs** (3.81%)
* **Root Cause:** Next.js layout metadata appends an extensive branding string (e.g., `| Aaraa Infrastructure Pvt Ltd - EPC & Civil Construction`), pushing titles beyond Google's 561-pixel desktop/mobile cutoff.
* **Fix:** Shorten the default branding suffix in `src/app/layout.tsx` to `| AARAA Infrastructure` and keep primary titles under 55 characters to ensure key keywords appear before the truncation point.

### 3.2. Thin / Low-Content Pages (<200 Words) — 36 URLs (34.29%)
* **Root Cause:** Category filter views, placeholder location pages, or short confirmation screens.
* **Impact:** Search engines may classify thin content pages as "Soft 404" or lower the site's overall content quality score.
* **Fix:**
  - Add meaningful editorial content (at least 300+ words with structured FAQs and service specifications).
  - For utility or form submission endpoints, apply `noindex, follow` robots meta tags.

### 3.3. Heading Tag Structure & Hierarchy
* **H1 Duplicate:** **14 URLs** (13.33%)
* **H1 Non-Sequential:** **17 URLs** (16.19%)
* **H1 Over 70 Characters:** **16 URLs** (15.24%)
* **H1 Multiple:** **1 URL** (0.95%)
* **H2 Missing:** **41 URLs** (39.05%)
* **H2 Non-Sequential:** **43 URLs** (40.95%)
* **H2 Duplicate:** **37 URLs** (35.24%)
* **Fix:** Enforce a strict heading hierarchy across all page templates:
  - Exactly one `<h1>` per page reflecting the main topic.
  - Subtopics sequentially descending into `<h2>`, then `<h3>`. Never skip heading ranks.

---

## 4. Asset Performance & Security Hardening

### 4.1. Image Size & Layout Shift (CLS)
* **Images Over 100 KB:** **308 Images** (69.84% of 441 images)
* **Images Missing Size Attributes (`width` / `height`):** **441 Images** (100.00%)
* **Images Missing Alt Text:** **5 Images** (1.13%)
* **Alt Text Over 100 Characters:** **6 Images** (1.36%)
* **Fix:**
  - Implement Next.js `<Image />` component with explicit width and height attributes (or `fill` with an aspect ratio wrapper) to eliminate Cumulative Layout Shift (CLS).
  - Compress large JPG/PNG hero images into modern WebP format (<100 KB target).
  - Provide concise, descriptive alt text for the 5 flagged images.

### 4.2. Security Headers (Missing on 96.39% of URLs)
* **Missing `X-Frame-Options` Header:** **561 URLs**
* **Missing `Content-Security-Policy` Header:** **561 URLs**
* **Unsafe Cross-Origin Link:** **1 URL** (`target="_blank"` without `rel="noopener"`)
* **Fix:** Add security headers in `next.config.mjs`:
  ```javascript
  // next.config.mjs
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  }
  ```

### 4.3. Anchor Text Optimization
* **Internal Outlinks With No Anchor Text:** **23 URLs** (21.90%)
* **Non-Descriptive Anchor Text ("Learn More", "Click Here"):** **2 URLs** (1.90%)
* **Fix:** Provide descriptive anchor text or add an `aria-label` to icon/image links to pass clear keyword relevance signals.

---

## 5. Prioritized Implementation Roadmap

| Priority | Category | Action Item | Target Impact |
| :---: | :--- | :--- | :--- |
| **P1** | **Crawl & Indexation** | Clean internal links pointing to `robots.txt`-blocked routes; verify 301 redirects for 4xx errors; resolve the 1 canonical mismatch. | Eliminates crawl errors and preserves search crawl budget. |
| **P2** | **SERP Snippets** | Shorten the global title template suffix from ~45 to ~18 characters; resolve 4 duplicate titles and 8 duplicate meta descriptions. | Eliminates SERP title truncation and boosts click-through rate (CTR). |
| **P3** | **Performance & CLS** | Specify explicit width/height dimensions on image elements and compress images $>100\text{ KB}$ into WebP. | Drastically reduces Cumulative Layout Shift (CLS) and improves Core Web Vitals. |
| **P4** | **Security & Structure** | Configure `X-Frame-Options` and baseline security headers in `next.config.mjs`; fix heading hierarchy across templates. | Hardens site security against clickjacking and standardizes semantic HTML. |
