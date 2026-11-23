# AARAA INFRASTRUCTURE — HOMEPAGE QUALITY & CONVERSION REMEDIATION
## CHANGED FILES LOG

**Project:** AARAA Infrastructure Website  
**Repository:** `D:\Web_Projects\aaraa-infrastructure-nextjs`  
**Baseline Git Commit:** `588d0374835c7b5c2ce1f7f653d22ae1475fe0f4`  
**Authority:** Atlas — Technical Architecture Review  
**Date:** November 19, 2026  

---

### File Modification Inventory

The table below documents every file modified during the Homepage Quality & Conversion Remediation programme, categorized by scope and technical function:

| File Path | Functional Scope | Description of Modifications |
| :--- | :--- | :--- |
| `app/layout.js` | Area 2 (Metadata) | Excised placeholder verification meta block (`google_site_verification_placeholder`, `msvalidate_verification_placeholder`). |
| `components/BrandMarquee.js` | Area 5 (Logos) | Applied `aria-hidden="true"` and empty `alt=""` to duplicated marquee track items (indices 22–43) to prevent screen reader duplication. |
| `public/js/aaraa-modals.js` | Area 1 (Aadhaar) | Removed 12-digit Aadhaar regex validation block and dictionary labels. |
| `public/assets/js/forms.js` | Area 1 (Aadhaar) | Removed legacy `aadhaar4` regex rules and validation messaging. |
| `public/backend_node_server.js` | Area 1 (Aadhaar) | Removed Aadhaar label from server notification mappings. |
| `legacy-backend/functions/index.js` | Area 1 (Aadhaar) | Removed Aadhaar field from legacy cloud functions email template. |
| `legacy-backend/aaraa-forms/public/assets/js/forms.js` | Area 1 (Aadhaar) | Excised Aadhaar validation logic. |
| `legacy-backend/aaraa-forms/public/forms/vendor.html` | Area 1 (Aadhaar) | Excised Aadhaar form field and updated ID proof label. |
| `legacy-pages/aaraa-forms/public/forms/vendor.html` | Area 1 (Aadhaar) | Excised Aadhaar form field and updated ID proof label. |
| `legacy-pages/forms/vendor.html` | Area 1 (Aadhaar) | Removed `aadhaar_last4` field and updated ID proof label to Government Photo ID. |
| `legacy-pages/vendor-form.html` | Area 1 (Aadhaar) | Removed Aadhaar PDF document upload field. |
| `legacy-pages/vendor-registration.html` | Area 1 (Aadhaar) | Removed Aadhaar input group, updated ID proof label, removed JavaScript regex validation. |
| `legacy-pages/index.html` | Areas 1–4, 6–8 | **Major Homepage Remediation:**<br>1. Removed Aadhaar input from Vendor Modal.<br>2. Fixed unescaped apostrophe in meta description; standardized to "25+ major cities".<br>3. Unified FAQ email to `info@aaraainfrastructure.com`.<br>4. Updated H1 to keyword-rich structure with visual tagline.<br>5. Corrected ISO section heading from `<h3>` to `<h2>`.<br>6. Set ISO video `preload="none"` with poster image.<br>7. Added `loading="lazy"` to YouTube hero iframe.<br>8. Fixed client typo `Waree Energies'` to `Waaree Energies'`.<br>9. Fixed 140.6 MW Bhoomi Pooja card link to dedicated canonical slug `/blog/140-6-mw-wind-solar-hybrid-project-karnataka`.<br>10. Upgraded all 23 blog cards to semantic `<time datetime="...">` tags with explicit years.<br>11. Excised 13 tail duplicate cards (cards 24–36) saving 15.2 KB.<br>12. Corrected footer logo to `/`, sitemap to `/sitemap.xml`, and terms to `/aaraa-privacy-policy`.<br>13. Updated preloader with `sessionStorage` guard.<br>14. Updated dropdown menu items with `role="button"` and `aria-haspopup="true"`. |
| `legacy-pages/about.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/blog-details.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/blog-post-4.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/blog-post-6.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/career.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/career_old.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/careesr.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/chat.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/civil-and-pre-engineered-buildings.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/commercial.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/completed-projects.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/contact-us.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/faq.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/gallery.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/general-contracting-services.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/gpt.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/history.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/industrial.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/infrastructure.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/institutional.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/interior-fitout-contracts.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/interior-fitout.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/mep-hvac-services.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/new-blog.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/on-going-projects.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/project-details-infra.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/project-details-marriage.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/renewables.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/sectors.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/services.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/solar-epc-civil-infrastructure-kudligi-karnataka.html` | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar field. |
| `legacy-pages/blog/*.html` (6 files) | Area 1 (Aadhaar) | Removed legacy vendor modal Aadhaar fields from individual blog templates. |

---

### Preservation of Batch 4 Deliverables
Verified that all four Batch 4 formal closure deliverables remain untouched in the working directory:
1. `BATCH_4_FINAL_CLOSURE_EVIDENCE.md`
2. `BATCH_4_CORRECTED_IMAGE_RECONCILIATION.json`
3. `BATCH_4_LOGO_HASH_VERIFICATION.csv`
4. `BATCH_4_FINAL_IMAGE_INTEGRITY_REPORT.md`

Zero images were recompressed or modified during this remediation.

---
*Changed files log compiled and certified for Atlas Architecture Review.*
