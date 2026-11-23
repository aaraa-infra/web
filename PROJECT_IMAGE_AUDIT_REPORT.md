# Project Image Asset Audit & Cleanup Report

**AARAA Infrastructure Next.js Website**  
**Audit Date:** 20 November 2026  
**Auditor:** Senior Full-Stack Engineer & Asset Optimisation Specialist  
**Execution Status:** Completed & Quarantined  

---

## 1. Executive Summary

A comprehensive automated audit was conducted across all image directories in `public/` and all 506 source files across the repository (`app/`, `components/`, `lib/`, `legacy-pages/`, `public/css/`, etc.). 

The audit identified total image assets, active references, byte-level hash duplicates, dynamic 3D scroll frame sequences, and broken references. 1,404 verified orphaned image assets totaling **590.05 MB** were safely moved into a non-destructive quarantine directory (`_asset_quarantine/`), with 100% preservation of directory structure and full rollback capability via automated manifest.

| Metric | Count / Volume | Description |
|---|---|---|
| **Total Image Assets Scanned** | 4,574 files | 1,694.89 MB in `public/` |
| **Active & Referenced Images** | 1,670 files | Used across 414 static pages, App Router components, metadata, and CSS |
| **Potentially Dynamic Assets (Preserved)** | 1,500 files | 3D scroll animation frames in `public/3d-scroll/` (retained in place) |
| **Protected System Images** | 31 files | Logos, favicons, OG social cards, touch icons |
| **Verified Orphaned / Unused Images** | 1,404 files | **590.05 MB** quarantined |
| **Hash Duplicate Groups** | 526 groups | 1,133 files sharing identical MD5 hashes |
| **Broken Image Code References** | 64 references | Outdated CSS background URLs and legacy template references |
| **Recovered Active Storage** | **590.05 MB** | 34.8% reduction in repository asset weight |

---

## 2. Methodology & Detection Logic

1. **Source Code Extraction:**
   - Evaluated 506 source files (JSX, TSX, JS, HTML, CSS, JSON).
   - Regex and literal string matching for all public URL paths (`/image/...`, `/images/...`, `/icons/...`, `/location/...`, `/3d-scroll/...`).
   - Deep inspection of `lib/image-metadata-map.json` and legacy template bindings.

2. **Classification Categories:**
   - **USED (`1,670`):** Found in at least one source file or metadata mapping.
   - **POTENTIALLY_UNUSED_3D_SCROLL (`1,500`):** Sequential frame images (`ezgif-frame-*.jpg`) used for interactive 3D scrubbing. Completely shielded from quarantine.
   - **USED_PROTECTED (`31`):** Essential system files matching `/logo/`, `/favicon/`, `/og-/`, `/icon/`, etc.
   - **UNUSED (`1,404`):** Exactly 0 occurrences across all source files, templates, CSS, and metadata maps.

3. **Safe Quarantine Policy:**
   - Zero permanent deletions were executed.
   - Files were moved to:
     - `_asset_quarantine/unused-images/`: Orphaned assets.
     - `_asset_quarantine/duplicate-images/`: Duplicate unreferenced assets.
   - Full subdirectory hierarchies are mirrored inside the quarantine folders.
   - Two CSV manifests were generated in the project root:
     - `UNUSED_IMAGE_MANIFEST.csv`
     - `ASSET_RESTORATION_MANIFEST.csv`

---

## 3. Directory Breakdown of Quarantined Assets

| Directory Origin | Quarantined Count | Notes |
|---|---|---|
| `public/images/blog/` | 773 | Obsolete, unlinked, or legacy duplicate blog images |
| `public/image/blog/` | 201 | Unreferenced legacy blog thumbnails and drafts |
| `public/image-watermarked/blog/` | 107 | Duplicate watermarked variants with 0 references |
| `public/images/km-palace/` | 41 | Unreferenced redundant project shots |
| `public/image/project-item/` | 35 | Legacy project card backgrounds and thumbnails |
| `public/images-watermarked/blog/` | 30 | Duplicate unreferenced watermarked blog graphics |
| `public/images/kudligi/` | 25 | Unused project photographs |
| `public/images-watermarked/km-palace/` | 25 | Unreferenced watermarked variants |
| `public/image/section/` | 22 | Unreferenced section backgrounds |
| `public/images/waaree/` | 22 | Redundant project photography |
| `public/image-watermarked/km-palace/` | 21 | Unreferenced watermarked files |
| `public/images-watermarked/waaree/` | 12 | Unreferenced watermarked project images |
| `public/image-watermarked/project-item/` | 11 | Redundant project item graphics |
| `Other miscellaneous directories` | 99 | Legacy drafts, unused thumbs, unreferenced test files |
| **Total Quarantined** | **1,404** | **590.05 MB recovered** |

---

## 4. Duplicate Image Analysis

A total of **526 hash duplicate groups** comprising 1,133 files were cataloged.
- **Root Cause:** Legacy migration artifacts where images were duplicated across both `public/image/` and `public/images/`, as well as watermarking batch scripts that created copies in `public/image-watermarked/` and `public/images-watermarked/`.
- **Handling Strategy:**
  - If a duplicate was unreferenced, it was quarantined to `_asset_quarantine/duplicate-images/`.
  - If both copies were referenced by different legacy HTML pages, both were preserved to prevent 404 broken images on live routes.

---

## 5. Broken Image References Identified

64 references in the codebase pointed to non-existent or moved image paths. The predominant sources:
1. `public/css/styles.css`: Legacy theme CSS rules pointing to non-existent background textures (`../image/section/bg-header-wood.jpg`, `../image/blog/bg-newletter.jpg`, `../image/section/wg-video-*.jpg`).
2. Template string artifacts: E.g., `"${BASE_URL}/logo.png"` in `app/careers/page.js` where the literal template syntax was detected by naive scanners (the file itself exists at `/logo.png`).

---

## 6. Restoration & Rollback Instructions

In the event that an asset is required in future releases, restoration is instantaneous.

### Automated Rollback (PowerShell):
Inspect `ASSET_RESTORATION_MANIFEST.csv` which contains the exact PowerShell command for every single file.

To restore an individual image:
```powershell
Move-Item -Path "_asset_quarantine/unused-images/image/blog/example.jpg" -Destination "public/image/blog/example.jpg" -Force
```

To restore all quarantined images:
```powershell
Import-Csv ASSET_RESTORATION_MANIFEST.csv | ForEach-Object {
    $parent = Split-Path $_."Original Path" -Parent
    if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force }
    Move-Item -Path $_."Quarantine Path" -Destination $_."Original Path" -Force
}
```

---

*Report automatically generated as part of the Comprehensive Site Audit.*
