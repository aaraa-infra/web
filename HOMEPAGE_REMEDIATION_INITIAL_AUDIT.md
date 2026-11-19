# AARAA INFRASTRUCTURE — HOMEPAGE QUALITY & CONVERSION REMEDIATION
## INITIAL AUDIT & GAP ANALYSIS REPORT

**Project:** AARAA Infrastructure Website  
**Repository:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Reference Document:** `c:\Users\SRIDHAR-AARAA\Downloads\aaraa-homepage-fix-kit.md`  
**Framework:** Next.js 15.5.x App Router with Static Export  
**Baseline Git Commit:** `588d0374835c7b5c2ce1f7f653d22ae1475fe0f4`  
**Authority:** Atlas — Technical Architecture Review  
**Date:** November 19, 2026  

---

### Executive Summary

Atlas has initiated a new, independent quality and conversion remediation programme for the AARAA Infrastructure homepage following the formal closure and repository freeze of Batch 4 (Technical SEO & Image Optimisation).

This audit evaluates all eight functional areas outlined in the Claude Homepage Audit and Fix Kit against the actual codebase. Each item has been inspected at the source level and assigned one of five strict Atlas classifications:
1. `ALREADY FIXED` — Fully addressed in prior batches; no code changes required.
2. `VERIFIED – REQUIRES FIX` — Objectively verified in source code as a defect, risk, or inconsistency; safe to remediate under current architectural guidelines.
3. `NOT VERIFIED` — Stated in external audit but not present, not reproducible, or already handled in the current codebase.
4. `MANAGEMENT CONFIRMATION REQUIRED` — Pertains to commercial facts, legal text, business metrics, or external relationships that cannot be assumed by technical engineering.
5. `NOT RECOMMENDED AS WRITTEN` — Proposed change conflicts with current architecture, introduces regression risk, or harms existing verified SEO/UX foundations.

---

### Area-by-Area Classification Matrix

| Area | Topic / Recommendation | Classification | Rationale & Code Location |
| :--- | :--- | :--- | :--- |
| **1.1** | Remove Aadhaar field from Vendor Registration Modal | `VERIFIED – REQUIRES FIX` | Present in `legacy-pages/index.html` (lines 458–459) and `legacy-pages/vendor-registration.html`. High legal compliance risk under Aadhaar Act. |
| **1.2** | Remove Aadhaar from Frontend JS Validation | `VERIFIED – REQUIRES FIX` | `public/js/aaraa-modals.js` (lines 217–220) enforces 12-digit Aadhaar regex. Must be excised. |
| **1.3** | Remove Aadhaar from Backend API & Storage | `ALREADY FIXED` | `app/api/vendor/route.js` does NOT collect or process Aadhaar. Verified that existing submission `vendor_AAVN20260821-001.json` contains no Aadhaar data. |
| **2.1** | Unescaped Apostrophe in Meta Description | `VERIFIED – REQUIRES FIX` | `legacy-pages/index.html` (line 30) contains unescaped single quote in `"India's leading EPC..."`. Replace with clean non-conflicting copy. |
| **2.2** | Remove Placeholder Verification Tags | `VERIFIED – REQUIRES FIX` | `app/layout.js` (lines 20–24) defines literal placeholders `google_site_verification_placeholder` and `msvalidate_verification_placeholder` rendered site-wide. |
| **3.1** | Contact Email Inconsistency (`info@` vs Gmail) | `VERIFIED – REQUIRES FIX` | `legacy-pages/index.html` uses `aaraainfrastructure@gmail.com` in FAQ (line 226) and JSON-LD schema (line 1334), while footer uses `info@aaraainfrastructure.com`. Must unify to official corporate email. |
| **3.2** | City Coverage Count ("20+" vs "25+") | `MANAGEMENT CONFIRMATION REQUIRED` | Site has 25 dedicated city pages. Body text uses "20+ cities" (line 865) while FAQ uses "25+ cities" (line 218). Requires management confirmation to standardize. |
| **3.3** | Kudligi Project Size Inconsistency | `MANAGEMENT CONFIRMATION REQUIRED` | Homepage mentions 132 MW and 140.6 MW in different project cards. Both may be distinct contract packages (e.g. 140.6 MW overall hybrid plant vs 132 MW civil package), requiring confirmation of exact scope titles. |
| **3.4** | Kudligi Duplicate Blog Slug on Homepage | `VERIFIED – REQUIRES FIX` | Homepage line 1540 card ("AARAA Commences 140.6 MW Project") links to `/blog/solar-epc-civil-infrastructure-kudligi-karnataka`, which is the slug for the 132 MW post. The standalone post `/blog/140-6-mw-wind-solar-hybrid-project-karnataka` already exists and must be linked. |
| **3.5** | Client Typo ("Waree Energies") | `VERIFIED – REQUIRES FIX` | `legacy-pages/index.html` (line 1637) contains typo `Waree Energies`. Must be updated to `Waaree Energies`. |
| **3.6** | Location Spelling (Hulikunta vs Hulikunte) | `MANAGEMENT CONFIRMATION REQUIRED` | Kudligi is the Taluk; Hulikunte is the project site village. Standard spelling preference requires client sign-off. |
| **4.1** | Blog Post Dates: Add Machine-Readable `<time>` and Years | `VERIFIED – REQUIRES FIX` | Homepage cards lack year designations (e.g. "September 04" instead of full date) and semantic `<time>` tags. |
| **4.2** | Deduplicate Category Cards on Homepage | `VERIFIED – REQUIRES FIX` | Multiple identical posts (Reliance, Waaree) are duplicated across split category tabs on the homepage. |
| **4.3** | Cap Homepage Blog Cards at 6 Posts | `VERIFIED – REQUIRES FIX` | Homepage currently lists ~36 cards across DOM blocks, bloating HTML payload. Capping at the 6 newest posts optimizes performance while linking to `/blog`. |
| **5.1** | Delete Client Logos 9–22 | `NOT RECOMMENDED AS WRITTEN` | 22 logos were verified byte-for-byte in Batch 4 (`BATCH_4_LOGO_HASH_VERIFICATION.csv`). Deleting client logos without client approval risks removing legitimate project references. |
| **5.2** | Client Logo Marquee Accessibility (Clone Track) | `VERIFIED – REQUIRES FIX` | `components/BrandMarquee.js` clones 22 logos for CSS animation without `aria-hidden="true"`, causing duplicate screen reader announcements. Adding `aria-hidden="true"` and empty `alt=""` resolves this. |
| **5.3** | Rename "Our Trusted Partners" to "Clients & Project Partners" | `MANAGEMENT CONFIRMATION REQUIRED` | Section header change impacts corporate branding and client relationship definitions. |
| **6.1** | Dead Navigation Dropdown Links (`href="#"`) | `VERIFIED – REQUIRES FIX` | Dropdown headers (`Explore AARAA`, `Join AARAA`, `Sectors`, `Services`) use `href="#"`. Replacing with semantic buttons or inert spans prevents invalid anchor navigation. |
| **6.2** | Footer "Terms of use." and "Site map." Dead Links | `VERIFIED – REQUIRES FIX` | Line 2092 points to `href="#"` for Terms and line 2093 points to `href="#"` for Site map. Site map must link to `/sitemap.xml`; Terms link should route to `/aaraa-privacy-policy` until separate Terms page is commissioned. Footer logo link `href="#"` at line 2068 must point to `/`. |
| **6.3** | Consolidate 3 Contact Forms into 1 | `NOT RECOMMENDED AS WRITTEN` | Collapsing existing contact section forms (Enquiry, Email, Callback) into a single form redesigns established visual layout and lead routing. Keeping separate tabbed/modal forms while hardening validation and privacy consent is safer. |
| **7.1** | Keyword-Rich H1 with Visual Tagline | `VERIFIED – REQUIRES FIX` | Current H1 is `<h1 class="hero-title">Building Trust.<br/>Delivering Excellence.</h1>`. Updating to incorporate EPC contractor keywords while preserving visual tagline improves homepage topical authority. |
| **7.2** | Heading Hierarchy Defect in ISO Section | `VERIFIED – REQUIRES FIX` | Line 535 uses `<h3 class="cert-hero-title">OUR ISO<br/>CERTIFICATIONS</h3>` immediately below H1. Must be corrected to `<h2>` to maintain standard outline hierarchy. |
| **7.3** | Stats Strip Insertion | `MANAGEMENT CONFIRMATION REQUIRED` | Inserting speculative statistics (sq ft built, completed projects) without corporate sign-off violates data accuracy standards. |
| **7.4** | ISO Certification Indexable Text & Numbers | `MANAGEMENT CONFIRMATION REQUIRED` | Exact ISO certification numbers, issuing registrar, and validity dates must be provided by management before publishing indexable claims. |
| **7.5** | Client Testimonials Section | `NOT VERIFIED` / `MANAGEMENT CONFIRMATION REQUIRED` | Cannot fabricate quotes or customer names. Requires client marketing submission. |
| **8.1** | ISO Video Eager Preloading | `VERIFIED – REQUIRES FIX` | `legacy-pages/index.html` line 538 sets `preload="auto"` on 7.3 MB MP4 video. Setting `preload="none"` with poster image prevents massive initial bandwidth consumption. |
| **8.2** | YouTube Hero Iframe Deferral | `VERIFIED – REQUIRES FIX` | YouTube iframe loads synchronously during page parse. Deferring iframe initialization to idle/interaction while displaying hero poster improves LCP. |
| **8.3** | Preloader Execution Optimization | `VERIFIED – REQUIRES FIX` | Preloader runs on every page reload. Guarding with `sessionStorage` ensures it runs only once per browsing session. |
| **8.4** | Image Width/Height and CLS Prevention | `ALREADY FIXED` | Formally resolved and verified across 256 canonical assets during Batch 4 closure. |

---

### Detailed Findings by Functional Area

#### Area 1: Aadhaar De-risking
- **HTML:** `legacy-pages/index.html` lines 458–459 contains:
  ```html
  <label for="v_aadhaar">Aadhaar Number</label>
  <input class="aaraa-popup-field" id="v_aadhaar" name="aadhaar" ... />
  ```
  Similar field exists in `legacy-pages/vendor-registration.html`.
- **JS:** `public/js/aaraa-modals.js` lines 217–220 validates Aadhaar:
  ```javascript
  if (name === 'aadhaar' && val && !/^\d{12}$/.test(val)) {
    valid = false;
    error = 'Enter a valid 12-digit Aadhaar number';
  }
  ```
- **Backend & Data Storage:** Inspected `app/api/vendor/route.js`. The API handler extracts only: `companyName`, `contactPerson`, `email`, `phone`, `category`, `panNumber`, `gstNumber`, `address`, `experience`, `projects`. Aadhaar is **not** handled, stored, or sent via email. Inspected `public/local_submissions/vendor_AAVN20260821-001.json` — zero Aadhaar records exist on disk.
- **Action Plan:** Delete Aadhaar input and label from both HTML pages; excise validation block from `public/js/aaraa-modals.js`.

#### Area 2: Metadata & Verification Tags
- **Placeholder Verification:** `app/layout.js` lines 20–24 specifies:
  ```javascript
  verification: {
    google: 'google_site_verification_placeholder',
    other: {
      'msvalidate.01': ['msvalidate_verification_placeholder'],
    },
  },
  ```
  This injects invalid verification meta tags on all statically exported pages.
- **Apostrophe in Description:** `legacy-pages/index.html` line 30 contains:
  ```html
  <meta content="India's leading EPC contractor..." name="description"/>
  ```
- **Action Plan:** Remove placeholder verification block from `app/layout.js`; update meta descriptions to clean phrasing. Real verification should be handled via GTM container `GTM-THL6P3ZB` or Cloudflare DNS TXT records.

#### Area 3: Fact Consistency & Editorial Accuracy
- **Email Inconsistency:** FAQ schema and text in `legacy-pages/index.html` (lines 226, 1334) use `aaraainfrastructure@gmail.com`. The footer and contact section use `info@aaraainfrastructure.com`. Standardizing on `info@aaraainfrastructure.com` unifies brand communication.
- **Client Typo:** Line 1637 contains `Waree Energies` instead of `Waaree Energies`.
- **Blog Link Defect:** Card at line 1540 ("AARAA Commences 140.6 MW Project") incorrectly routes to `/blog/solar-epc-civil-infrastructure-kudligi-karnataka`, which is the URL of the 132 MW project. The actual post `/blog/140-6-mw-wind-solar-hybrid-project-karnataka` is already compiled and present in the build tree. Updating line 1540 resolves the collision.

#### Area 4: Homepage Blog Performance & Structure
- **DOM Bloat:** The homepage currently includes dozens of blog cards split across categories, rendering redundant cards for the same projects (e.g. Reliance and Waaree repeated multiple times).
- **Date Standards:** Existing cards display month/day without year (e.g. "September 04"), leading to ambiguity and missing semantic `<time>` tags.
- **Action Plan:** Add full dates with `<time datetime="...">` tags, remove card duplicates, and cap the homepage feed to the 6 most recent articles, directing users to `/blog` for complete archives.

#### Area 5: Client Logos & Brand Marquee
- **22 Logos Authenticity:** Batch 4 established a formal cryptographic audit (`BATCH_4_LOGO_HASH_VERIFICATION.csv`) showing 22 verified logos matching Git HEAD. Deleting logos 9–22 without explicit management request would damage legitimate partner representations.
- **Marquee A11y:** `components/BrandMarquee.js` maps `TRACK_ITEMS = [...BRANDS, ...BRANDS]` to create an infinite loop. The second set (indices 22–43) must be marked `aria-hidden="true"` with empty `alt=""` attributes so assistive technologies do not read all 22 logos twice.

#### Area 6: Navigation, Forms & Footers
- **Navigation Parent Items:** Dropdown headings (`Explore AARAA`, `Join AARAA`, `Sectors`, `Services`) currently use dead anchor links `href="#"`. Replacing them with semantic button elements or inert menu toggles prevents navigation jumps.
- **Footer Links:** Update `Site map.` from `href="#"` to `href="/sitemap.xml"`. Update footer logo link from `href="#"` to `href="/"`. Audit `Terms of use.` to point to Privacy Policy until formal Terms are drafted.

#### Area 7: SEO Content & Heading Hierarchy
- **Heading Level Fix:** Section heading `<h3>OUR ISO CERTIFICATIONS</h3>` at line 535 must be converted to `<h2>` to resolve an H1 → H3 skip in the document outline.
- **H1 Optimization:** Update `h1.hero-title` to include target contractor keywords alongside the existing visual brand tagline:
  `Turnkey Civil Construction, PEB & Solar EPC Contractor in India`
  `<span class="hero-tagline">Building Trust. Delivering Excellence.</span>`

#### Area 8: Performance Optimization
- **ISO Video Preload:** Set `preload="none"` on `cert-youtube-iframe` video in `legacy-pages/index.html` to prevent downloading 7.3 MB of MP4 data on initial page visit.
- **Hero Video Deferral:** Defer YouTube iframe creation to `requestIdleCallback` or first interaction so the hero poster image serves as the initial LCP element.
- **Preloader Session Storage:** Ensure preloader executes only once per browser session via `sessionStorage`.

---

### Classification Summary Table

| Category | Count | Status |
| :--- | :---: | :--- |
| `ALREADY FIXED` | 2 | Verified in place; zero action needed |
| `VERIFIED – REQUIRES FIX` | 15 | Approved for implementation in this phase |
| `MANAGEMENT CONFIRMATION REQUIRED` | 7 | Isolated into dedicated confirmation briefing |
| `NOT RECOMMENDED AS WRITTEN` | 2 | Retained in current form to protect stability & design |
| `NOT VERIFIED` | 1 | Cannot proceed without external client data |

---
*Report compiled and certified for Atlas Architecture Review.*
