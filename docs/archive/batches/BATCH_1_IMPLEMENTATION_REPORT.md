# BATCH 1 IMPLEMENTATION REPORT: TECHNICAL SEO & SECURITY HEADERS
**Target Domain:** [https://www.aaraainfrastructure.com/](https://www.aaraainfrastructure.com/)  
**Execution Date:** November 18, 2026  
**Implementation Stage:** Batch 1 Completed  
**Branch:** `main`

---

## 1. Files Modified and Exact Absolute Paths

The following 5 files were modified during the Batch 1 implementation:

1. **`D:\Web_Projects\aaraa-infrastructure-nextjs\next.config.mjs`**
   - *Role:* Global Next.js configuration and response header definitions.
2. **`D:\Web_Projects\aaraa-infrastructure-nextjs\lib\legacy-page.js`**
   - *Role:* Server-side HTML parsing, dynamic URL resolution, and cross-origin anchor sanitization.
3. **`D:\Web_Projects\aaraa-infrastructure-nextjs\legacy-pages\140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project.html`**
   - *Role:* Project story landing page template containing external social share anchors.
4. **`D:\Web_Projects\aaraa-infrastructure-nextjs\legacy-pages\400-MLD-SWRO-Desalination-Project-Perur-TamilNadu.html`**
   - *Role:* Desalination project landing page template containing external social share anchors.
5. **`D:\Web_Projects\aaraa-infrastructure-nextjs\legacy-pages\industrial-development-blue-star-uthukottai.html`**
   - *Role:* Industrial development project landing page template containing external social share anchors.

---

## 2. Before-and-After Changes

| Component / File | Before Implementation | After Implementation |
| :--- | :--- | :--- |
| **`next.config.mjs`** | Only configured `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. Omitted `X-Frame-Options` and browser capability restrictions. | Added `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and modern `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| **`lib/legacy-page.js`** | Dynamically resolved body URLs (`src` and `href`) but did not inspect `target="_blank"` anchor tags for reverse tabnabbing attributes. | Added `sanitizeSafeExternalLinks(bodyHtml)` to inspect every `target="_blank"` anchor and automatically guarantee `rel="noopener noreferrer"`. |
| **`140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project.html`** | Lines 245–246: Bare `target="_blank"` on Facebook & LinkedIn share buttons without `rel` attribute. | Explicitly added `rel="noopener noreferrer"` to both share button anchor tags. |
| **`400-MLD-SWRO-Desalination-Project-Perur-TamilNadu.html`** | Lines 234–235: Bare `target="_blank"` on Facebook & LinkedIn share buttons without `rel` attribute. | Explicitly added `rel="noopener noreferrer"` to both share button anchor tags. |
| **`industrial-development-blue-star-uthukottai.html`** | Lines 298–299: Bare `target="_blank"` on Facebook & LinkedIn share buttons without `rel` attribute. | Explicitly added `rel="noopener noreferrer"` to both share button anchor tags. |

---

## 3. Redirect Mappings for Affected 4xx URLs

In the baseline crawl report, 6 internal URLs were flagged under `Response Codes: Internal Client Error (4xx)`:

| # | Requested Crawl URL | Redirect / Target Destination | Status Code | Preservation Justification |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `/forms/subcontractor` | `/subcontractor-empanelment` | `301 / 308` | Form was previously an unindexed embed; now points to the full SEO landing page. |
| 2 | `/forms/partnership` | `/strategic-partnerships` | `301 / 308` | Maps directly to the established corporate partnerships landing page. |
| 3 | `/forms/vendor` | `/vendor-registration` | `301 / 308` | Directs supplier traffic to the verified vendor onboarding page. |
| 4 | `/forms/joint-venture` | `/joint-ventures` | `301 / 308` | Routes EPC consortium requests to the official Joint Ventures page. |
| 5 | `/forms/careers` | `/careers` | `301 / 308` | Consolidates job application traffic to the active Next.js careers engine. |
| 6 | `/blog-post-5` | `/blog/reliance-civil-interior-mep-fitout-chennai` | `308 Permanent` | Maps legacy generic slug to the keyword-rich permanent canonical blog post. |

---

## 4. Robots.txt Analysis & Route Justification

File inspected: `public/robots.txt`
```text
User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /admin-dashboard
Disallow: /e-mail-sign/
Disallow: /aaraa-forms/
Disallow: /forms/
Disallow: /chat.html
Disallow: /gpt.html
Disallow: /location/

# Allow OpenAI Search Bot (OAI-SearchBot)
User-agent: OAI-SearchBot
Allow: /

Sitemap: https://www.aaraainfrastructure.com/sitemap.xml
Sitemap: https://www.aaraainfrastructure.com/sitemap-jobs.xml
```

### Route-by-Route Justification:
* **`Disallow: /forms/` and `Disallow: /aaraa-forms/`:**  
  *Justification:* These directories contain raw iframe form handlers and backend webhook endpoints. They lack standalone SEO copy, navigation, and structural context. Disallowing them prevents search engines from indexing utility forms.  
  *Action:* Internal navigation links pointing to `/forms/*` must be updated to point to the indexable landing pages (`/subcontractor-empanelment`, etc.) rather than modifying robots.txt to index thin forms.
* **`Disallow: /location/`:**  
  *Justification:* Legacy location placeholder pages lack localized original content and were triggering thin-content warnings. They are intentionally kept non-indexable until location-specific case studies are completed.
* **`Disallow: /wp-admin/`, `/admin-dashboard`, `/chat.html`, `/gpt.html`:**  
  *Justification:* Administrative and experimental AI utility pages that must not enter the public Google search index.

---

## 5. Canonical Correction Details

The crawl report identified **1 Canonicalised URL (0.95%)**:
* **Flagged URL:** `https://www.aaraainfrastructure.com/blog/rmky-industrial-construction-dobbaspet-karnataka`
* **Canonical Destination:** `https://www.aaraainfrastructure.com/blog/ramky-industrial-construction-dobbaspet-karnataka`
* **Correction Logic in `app/[[...slug]]/page.js`:**
  ```javascript
  let cleanPath = pathName.replace(/\.html$/, '');
  if (REDIRECTS_MAP[cleanPath]) {
    cleanPath = REDIRECTS_MAP[cleanPath].replace(/^\//, '');
  }
  canonicalUrl = `https://www.aaraainfrastructure.com${cleanPath ? '/' + cleanPath : ''}`;
  ```
  This ensures that any legacy or misspelled URL automatically declares the exact, clean destination URL as its canonical tag, avoiding canonical loops or unindexed orphan states.

---

## 6. Internal Linking Corrections

During the crawl audit, Screaming Frog identified that the navigation bar and footer in several legacy templates still pointed to `/forms/subcontractor`, `/forms/partnership`, etc., causing search engines to encounter blocked internal inlinks.

* **Legacy Links Flagged:**
  - `<a href="/forms/partnership">Strategic Partnerships</a>`
  - `<a href="/forms/joint-venture">Joint Ventures</a>`
  - `<a href="/forms/vendor">Become a Vendor</a>`
  - `<a href="/forms/subcontractor">Subcontractor Empanelment</a>`
* **Remediation Strategy (Batch 2 Target):**
  - Update all header navigation and footer components to link directly to:
    - `/strategic-partnerships`
    - `/joint-ventures`
    - `/vendor-registration`
    - `/subcontractor-empanelment`
  - This preserves internal PageRank, clears the 10 "Blocked by Robots.txt" warnings, and provides direct paths to 200 OK indexable pages.

---

## 7. Git Diff Summary

```diff
diff --git a/legacy-pages/140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project.html b/legacy-pages/140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project.html
index 074f299..6f9ff2f 100644
--- a/legacy-pages/140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project.html
+++ b/legacy-pages/140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project.html
@@ -242,8 +242,8 @@
             <!-- Social Share -->
             <div class="social-share reveal">
                 <span>Share this project:</span>
-                <a href="https://www.facebook.com/sharer/sharer.php?u=https://aaraainfrastructure.com" id="share-fb" class="share-btn fb" target="_blank">Facebook</a>
-                <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aaraainfrastructure.com" id="share-ln" class="share-btn ln" target="_blank">LinkedIn</a>
+                <a href="https://www.facebook.com/sharer/sharer.php?u=https://aaraainfrastructure.com" id="share-fb" class="share-btn fb" target="_blank" rel="noopener noreferrer">Facebook</a>
+                <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aaraainfrastructure.com" id="share-ln" class="share-btn ln" target="_blank" rel="noopener noreferrer">LinkedIn</a>
             </div>
 
         </article>
diff --git a/legacy-pages/400-MLD-SWRO-Desalination-Project-Perur-TamilNadu.html b/legacy-pages/400-MLD-SWRO-Desalination-Project-Perur-TamilNadu.html
index e06ad92..9a22dab 100644
--- a/legacy-pages/400-MLD-SWRO-Desalination-Project-Perur-TamilNadu.html
+++ b/legacy-pages/400-MLD-SWRO-Desalination-Project-Perur-TamilNadu.html
@@ -231,8 +231,8 @@
             <!-- Social Share -->
             <div class="social-share reveal">
                 <span>Share this project:</span>
-                <a href="https://www.facebook.com/sharer/sharer.php?u=https://aaraainfrastructure.com" id="share-fb" class="share-btn fb" target="_blank">Facebook</a>
-                <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aaraainfrastructure.com" id="share-ln" class="share-btn ln" target="_blank">LinkedIn</a>
+                <a href="https://www.facebook.com/sharer/sharer.php?u=https://aaraainfrastructure.com" id="share-fb" class="share-btn fb" target="_blank" rel="noopener noreferrer">Facebook</a>
+                <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aaraainfrastructure.com" id="share-ln" class="share-btn ln" target="_blank" rel="noopener noreferrer">LinkedIn</a>
             </div>
 
         </article>
diff --git a/legacy-pages/industrial-development-blue-star-uthukottai.html b/legacy-pages/industrial-development-blue-star-uthukottai.html
index bdddd95..b1014c5 100644
--- a/legacy-pages/industrial-development-blue-star-uthukottai.html
+++ b/legacy-pages/industrial-development-blue-star-uthukottai.html
@@ -295,8 +295,8 @@
             <!-- Social Share -->
             <div class="social-share reveal">
                 <span>Share this project:</span>
-                <a href="https://www.facebook.com/sharer/sharer.php?u=https://aaraainfrastructure.com" id="share-fb" class="share-btn fb" target="_blank">Facebook</a>
-                <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aaraainfrastructure.com" id="share-ln" class="share-btn ln" target="_blank">LinkedIn</a>
+                <a href="https://www.facebook.com/sharer/sharer.php?u=https://aaraainfrastructure.com" id="share-fb" class="share-btn fb" target="_blank" rel="noopener noreferrer">Facebook</a>
+                <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aaraainfrastructure.com" id="share-ln" class="share-btn ln" target="_blank" rel="noopener noreferrer">LinkedIn</a>
             </div>
 
         </article>
diff --git a/lib/legacy-page.js b/lib/legacy-page.js
index ede8a86..47edc2c 100644
--- a/lib/legacy-page.js
+++ b/lib/legacy-page.js
@@ -35,6 +35,21 @@ function resolveBodyUrls(bodyHtml, sourcePath) {
   });
 }
 
+function sanitizeSafeExternalLinks(bodyHtml) {
+  if (!bodyHtml) return bodyHtml;
+  return bodyHtml.replace(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi, (match, attrs) => {
+    if (/\brel\s*=/i.test(attrs)) {
+      return match.replace(/\brel=(["'])([^"']*)\1/gi, (relMatch, q, relVal) => {
+        let values = relVal.split(/\s+/).filter(Boolean);
+        if (!values.includes('noopener')) values.push('noopener');
+        if (!values.includes('noreferrer')) values.push('noreferrer');
+        return `rel=${q}${values.join(' ')}${q}`;
+      });
+    }
+    return `<a ${attrs} rel="noopener noreferrer">`;
+  });
+}
+
 function candidates(parts=[]){const raw=parts.map(decodeURIComponent).join('/');if(raw.includes('..')||raw.includes('\\')||raw.includes('\0'))return[];if(!raw)return['index.html'];const s=raw.replace(/^\/+|\/+$/g,'');return s.endsWith('.html')?[s]:[`${s}.html`,`${s}/index.html`]}
 
 export async function loadLegacyPage(parts=[]){
@@ -79,6 +94,7 @@ function parse(html,sourcePath){
   collect(head);
   body=collect(body);
   body=resolveBodyUrls(body, sourcePath);
+  body=sanitizeSafeExternalLinks(body);
   
   const isHomepage = sourcePath === 'index.html' || sourcePath === '' || sourcePath === 'index';
   const title = isHomepage
diff --git a/next.config.mjs b/next.config.mjs
index 81b37b8..db8123a 100644
--- a/next.config.mjs
+++ b/next.config.mjs
@@ -8,8 +8,11 @@ const nextConfig = {
     return [{
       source: '/:path*',
       headers: [
+        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
         { key: 'X-Content-Type-Options', value: 'nosniff' },
-        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
+        { key: 'X-XSS-Protection', value: '1; mode=block' },
+        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
+        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
       ]
     }];
   },
```

---

## 8. npm Build and Lint Results

```text
> aaraa-infrastructure-nextjs@2.0.0 build
> next build

   ▲ Next.js 15.5.20
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 8.4s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/397) ...
   Generating static pages (99/397) 
   Generating static pages (198/397) 
   Generating static pages (297/397) 
 ✓ Generating static pages (397/397)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                                  Size  First Load JS
┌ ○ /_not-found                                             146 B         103 kB
├ ● /[[...slug]]                                          10.2 kB         116 kB
├   ├ /140.6_MW_Capacity_Wind–Solar_Hybrid_Power_Project
├   ├ /180-MWp-Solar-Power-Project-Tuticorin-TamilNadu
├   ├ /180-mwp-solar-power-project-tuticorin
├   └ [+381 more paths]
├ ƒ /api/careers/apply                                      146 B         103 kB
├ ƒ /api/careers/jobs                                       146 B         103 kB
├ ƒ /api/submit                                             146 B         103 kB
├ ƒ /api/vendor                                             146 B         103 kB
├ ○ /careers                                              1.21 kB         110 kB
├ ○ /careers/admin                                        5.02 kB         107 kB
├ ○ /careers/freshers                                       172 B         106 kB
├ ƒ /careers/guides/[guideSlug]                             163 B         106 kB
├ ○ /careers/internships                                    163 B         106 kB
├ ○ /careers/jobs                                         3.66 kB         113 kB
├ ƒ /careers/jobs/[jobSlug]                                 172 B         106 kB
├ ƒ /careers/locations/[locationSlug]                       172 B         106 kB
├ ƒ /careers/roles/[roleSlug]                               172 B         106 kB
├ ƒ /careers/roles/[roleSlug]/[locationSlug]                172 B         106 kB
└ ƒ /sitemap-jobs.xml                                       146 B         103 kB

Exit Code: 0 (Clean Build, 0 Type Errors, 0 Lint Failures)
```

---

## 9. Local URL Testing Results & HTTP Status Codes

### A. Root Domain (`http://localhost:3000/`)
```http
HTTP/1.1 200 OK
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Type: text/html; charset=utf-8
```

### B. Legacy Slug Redirect (`http://localhost:3000/blog-post-5`)
```http
HTTP/1.1 308 Permanent Redirect
location: /blog/reliance-civil-interior-mep-fitout-chennai
Refresh: 0;url=/blog/reliance-civil-interior-mep-fitout-chennai
```

### C. Resolved Destination Blog Post (`http://localhost:3000/blog/reliance-civil-interior-mep-fitout-chennai`)
```http
HTTP/1.1 200 OK
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Type: text/html; charset=utf-8
```

### D. Subcontractor Landing Page (`http://localhost:3000/subcontractor-empanelment`)
```http
HTTP/1.1 200 OK
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Type: text/html; charset=utf-8
```

---

## 10. Outstanding Issues and Known Limitations

The following items are isolated to subsequent batches:

1. **Title Length & Pixel Width (97 URLs > 60 chars / 561px):**
   - Brand suffix in root metadata appends excessive character length, causing search engines to truncate snippet titles in SERP listings.
2. **Duplicate Page Titles (4 URLs) & Duplicate Descriptions (8 URLs):**
   - Several related project pages share identical meta tags and require unique meta descriptions.
3. **Cumulative Layout Shift (CLS) on Images (441 Images Missing Size Attributes):**
   - Image elements rendered from legacy HTML lack inline `width` and `height` dimensions, causing browser layout shifts as images load.
4. **Heavy Image Assets (308 Images > 100 KB):**
   - Raw photographic assets require WebP compression to reduce page weight and improve mobile Core Web Vitals.
5. **Internal Anchor Text Quality (23 Outlinks Without Anchor Text):**
   - Hyperlinked icons and buttons without `aria-label` or text content need accessible labels.
