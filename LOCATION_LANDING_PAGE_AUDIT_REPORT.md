# AARAA INFRASTRUCTURE — LOCATION LANDING PAGE NETWORK AUDIT REPORT

**Authority:** Atlas — Technical Architecture & SEO Governance  
**Repository:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Primary Scope:** `public/location/`  
**Audit Date:** 19 November 2026  
**Execution Status:** NETWORK AUDIT COMPLETE — REMEDIATION IN PROGRESS  
**Master Inventory Reference:** [LOCATION_LANDING_PAGE_MASTER_INVENTORY.csv](file:///d:/Web_Projects/aaraa-infrastructure-nextjs/LOCATION_LANDING_PAGE_MASTER_INVENTORY.csv)

---

## 1. Executive Summary

A comprehensive, network-wide audit was conducted across every HTML landing page located under `public/location/`.

### Network Scope & Scale
- **Total City Directories Discovered:** 21 Cities
  - `ahmedabad`, `bengaluru`, `bidadi`, `chennai`, `coimbatore`, `delhi`, `gurugram`, `hosur`, `hyderabad`, `indore`, `jaipur`, `kochi`, `kolkata`, `mumbai`, `noida`, `oragadam`, `pune`, `sri-city`, `sriperumbudur`, `tuticorin`, `visakhapatnam`.
- **Root Directory Files:** 1 Overview Hub (`industrial-hubs.html`)
- **Total HTML Landing Pages Enumerated:** Exactly **175 HTML files**.

Every single page of the 175 audited currently suffers from two systemic, critical defects:
1. **Critical Logo Display Discrepancy & Overflow:** Every page links to an unoptimized remote image (`https://aaraainfrastructure.com/logo.png`) with intrinsic dimensions of `662 × 267`, missing HTML `width`/`height` attributes, and insufficient CSS width constraints.
2. **Critical Hero Image 404 & Grey Fallback:** Every page attempts to load non-existent relative image assets (specifically `../../solar-infrastructure-road-construction-epc-aaraa-infrastructure.webp`), causing immediate 404 HTTP errors on active hero slides, forcing the hero to render as a plain, unbranded dark grey background.

---

## 2. Root Cause Analysis: AARAA Logo Defect

### 2.1 Technical Investigation of the Oversized Logo
Inspection of the HTML markup and CSS across all 175 pages revealed:
```html
<!-- Current Markup in all 175 pages -->
<a href="https://www.aaraainfrastructure.com" class="logo">
    <img src="https://aaraainfrastructure.com/logo.png" alt="AARAA Infrastructure" loading="eager">
</a>
```
```css
/* Current Inlined CSS */
.logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: #222;
}

.logo img {
    height: 48px;
}
```

### 2.2 Mathematical & Aspect Ratio Breakdown
- **Source Asset Loaded:** `public/logo.png` (or remote `https://aaraainfrastructure.com/logo.png`)
  - Natural Dimensions: **662px wide × 267px high**
  - Natural Aspect Ratio: `662 / 267 = 2.4794`
  - When CSS sets `height: 48px`, without explicit width bounds or object-fit containment, the image renders at ~119px, but in flex layouts without `max-width: 130px`, high-DPI displays and DevTools measure erratic bounding boxes.
- **Approved Primary Brand Logo Asset:** `public/image/logo/logo-black.png`
  - Natural Dimensions: **1024px wide × 399px high**
  - Natural Aspect Ratio: `1024 / 399 = 2.5664`
  - At the Atlas-specified height of **50px**:
    $$\text{Target Width} = 50\text{px} \times 2.566416 = \mathbf{128.32\text{px}}$$
  - This perfectly matches Atlas's intended rendered specification of **128.31px × 50px**.

### 2.3 Required Remediation
1. Update `src` from `https://aaraainfrastructure.com/logo.png` to local authoritative asset `/image/logo/logo-black.png`.
2. Add explicit dimension attributes: `width="128"` and `height="50"`.
3. Update `.logo img` CSS:
   ```css
   .logo img {
       display: block;
       height: 50px;
       width: auto;
       max-width: 130px;
       object-fit: contain;
   }
   ```
4. Verify parent `.nav-container` flex alignments to prevent vertical stretching.

---

## 3. Root Cause Analysis: Hero Background Image Defect

### 3.1 Why Pages Render Plain Grey Fallback
In all 174 city landing pages, the hero section contains 8 slides:
```html
<section class="hero">
    <div class="hero-slide active" style="background-image: linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url('../../solar-infrastructure-road-construction-epc-aaraa-infrastructure.webp');"></div>
    <div class="hero-slide" style="background-image: linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url('../../peb-industrial-building-construction-epc-project.webp');"></div>
    <div class="hero-slide" style="background-image: linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url('../../solar-wind-hybrid-infrastructure-team-execution-aaraa-infrastructure.webp');"></div>
    <!-- Slides 4-8 use watermarked generic project items -->
```
- **Finding 1:** Files `solar-infrastructure-road-construction-epc-aaraa-infrastructure.webp`, `peb-industrial-building-construction-epc-project.webp`, and `solar-wind-hybrid-infrastructure-team-execution-aaraa-infrastructure.webp` **do not exist** anywhere in the repository.
- **Finding 2:** Because Slide 1 is marked `.hero-slide.active` with a broken relative path `../../...`, the browser fails to load the image (HTTP 404), rendering only `.hero-overlay` linear-gradient over the plain grey `#222` body background.
- **Finding 3:** The exact same identical 8 slides are copied across all 21 cities and 11 distinct services. A commercial building page in Chennai shows a (broken) solar road image, while a PEB warehouse in Ahmedabad attempts to load the same broken solar slide.

---

## 4. Service Category Classification & Hero Image Archetypes

To eliminate the generic grey background and provide relevant, photorealistic infrastructure photography, every landing page has been mapped to its core service category:

| # | Service Category | Affected Filename | Core Subject for Hero Photography |
|---|---|---|---|
| 1 | **Renewable Energy EPC** | `renewable-energy-epc-contractors.html` | High-capacity solar plant with active EPC installation & distant wind turbines |
| 2 | **Solar Infrastructure** | `solar-infrastructure-contractors.html` | Utility-scale solar farm photovoltaic array with substation & transmission |
| 3 | **Civil Infrastructure** | `civil-infrastructure-companies.html` | Highway bridge, flyover & major concrete civil engineering works |
| 4 | **Infrastructure Contractors** | `infrastructure-contractors.html` | Large-scale infrastructure excavation, precast concrete structures & cranes |
| 5 | **Commercial Building Contractors** | `commercial-building-contractors.html` | Contemporary Grade-A commercial glass & steel tower construction |
| 6 | **Commercial Construction** | `commercial-construction-contractors.html` | Reinforced concrete framing and glass curtain wall commercial development |
| 7 | **Industrial Construction** | `industrial-construction-contractors.html` | Modern industrial manufacturing plant, factory shed & heavy loading bays |
| 8 | **Institutional Building Contractors** | `institutional-building-contractors.html` | Modern university campus development with grand entrance & pathways |
| 9 | **Institutional Construction** | `institutional-construction-companies.html` | Multi-storey educational institution with on-site engineering supervision |
| 10 | **PEB Warehouse Builders** | `peb-warehouse-builders.html` | Pre-Engineered Building structural steel portal trusses & logistics bay |
| 11 | **Turnkey Construction** | `turnkey-construction-contractors.html` | Comprehensive turnkey project featuring integrated civil, PEB & MEP works |
| 12 | **Industrial Hubs Directory** | `industrial-hubs.html` | Sweeping aerial view of planned industrial corridor & manufacturing park |

---

## 5. Network-Wide Audit Metrics

- **Total HTML files audited:** 175
- **Pages with Logo Defect:** 175 / 175 (100%)
- **Pages with Hero Image 404 Defect:** 175 / 175 (100%)
- **Total Cities Covered:** 21
  - Ahmedabad (8 pages)
  - Bengaluru (9 pages)
  - Bidadi (8 pages)
  - Chennai (9 pages)
  - Coimbatore (9 pages)
  - Delhi (8 pages)
  - Gurugram (8 pages)
  - Hosur (9 pages)
  - Hyderabad (9 pages)
  - Indore (8 pages)
  - Jaipur (8 pages)
  - Kochi (8 pages)
  - Kolkata (8 pages)
  - Mumbai (8 pages)
  - Noida (8 pages)
  - Oragadam (8 pages)
  - Pune (8 pages)
  - Sri City (8 pages)
  - Sriperumbudur (8 pages)
  - Tuticorin (9 pages)
  - Visakhapatnam (8 pages)
  - Root Overview (`industrial-hubs.html`) (1 page)

---

## 6. Implementation Strategy

Rather than applying manual, error-prone edits, an automated batch pipeline will:
1. Generate 12 high-resolution, photorealistic 1920x1080 WebP images via Google Nano Banana (`image-generator`), storing them in `public/images/location-heroes/`.
2. Update all 175 files in `public/location/`:
   - Replace the logo markup with authoritative local `/image/logo/logo-black.png` and explicit `width="128" height="50"`.
   - Update `.logo img` CSS with `height: 50px; width: auto; max-width: 130px; object-fit: contain;`.
   - Replace the active hero slide URL with the matching service-specific WebP hero image.
   - Retain dark gradient overlay (`rgba(0,0,0,0.55)` to `rgba(0,0,0,0.25)`) ensuring crisp readability of white H1 headings and CTAs.
   - Preserve all existing SEO metadata, canonicals, H1 text, city phone numbers, FAQs, and lead forms.
3. Synchronize `legacy-pages/location/` to ensure full parity between Next.js SSG build routes and public static assets.
4. Execute full production build (`npm run build`) and verify zero regression.
