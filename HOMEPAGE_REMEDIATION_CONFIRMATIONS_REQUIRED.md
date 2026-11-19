# AARAA INFRASTRUCTURE — HOMEPAGE QUALITY & CONVERSION REMEDIATION
## MANAGEMENT CONFIRMATIONS & BUSINESS FACTS REQUIRED

**Project:** AARAA Infrastructure Website  
**Authority:** Atlas — Technical Architecture Review  
**Date:** November 19, 2026  
**Status:** PENDING MANAGEMENT INPUT  

---

### Purpose of this Briefing

To protect data integrity, corporate representation, and legal compliance, technical engineering does not fabricate business statistics, alter verified partner relationships, or invent legal claims. 

The following specific items from the Claude Homepage Audit require explicit confirmation or authorization from AARAA Infrastructure executive leadership before implementation.

---

### Itemized Confirmation Requests

#### 1. Geographic Coverage Standardization
* **Current Status in Code:**
  - Homepage body text (line 865) states: `"20+ major cities"`
  - Homepage FAQ (line 218) states: `"25+ major cities"`
  - Actual website architecture: Contains exactly **25 dedicated city/state landing pages** (Chennai, Bangalore, Hyderabad, Pune, Mumbai, Coimbatore, etc.).
* **Question for Management:**
  Should we standardize all marketing and FAQ copy across the site to **"25+ major cities"** to align directly with the 25 indexed location landing pages, or keep **"20+ major cities"**?
* **Recommendation:** Standardize to **"25+ major cities"**.

---

#### 2. Kudligi Project Capacity Nomenclature
* **Current Status in Code:**
  - Card at line 1540 announces commencement of **140.6 MW** Wind-Solar Hybrid Project in Kudligi, Karnataka.
  - Card at line 1652 references **132 MW** (or 132.26 MW) Solar EPC Civil Works in Kudligi.
* **Question for Management:**
  Are these two figures referring to:
  1. Two separate project phases / contracts (e.g. 140.6 MW total hybrid plant capacity vs a 132 MW civil engineering package awarded to AARAA)?
  2. Or an updated revision of the same project capacity?
* **Recommendation:** Retain both if they represent distinct milestones/scopes, but clearly specify scope in the card titles (e.g., *"140.6 MW Wind-Solar Hybrid Plant Commencement"* vs *"132 MW Solar EPC Civil Infrastructure Package"*).

---

#### 3. Standard Geographic Spelling for Karnataka Project Site
* **Current Status in Code:**
  - Taluk / District: Kudligi, Vijayanagara / Bellary, Karnataka.
  - Village spelling varies between **"Hulikunta"** (used in emergency mock drill post) and **"Hulikunte"** (used in project commencement posts).
* **Question for Management:**
  What is the official administrative spelling used in project contracts and client documentation: **Hulikunte** or **Hulikunta**?
* **Recommendation:** Standardize on **Hulikunte** across all technical articles, or retain both with clarified context (Kudligi Taluk, Hulikunte Village).

---

#### 4. Client Logo Retention & Relationship Descriptors (Logos 9–22)
* **Current Status in Code:**
  - Batch 4 completed a byte-level verification of all 22 client logos (`BATCH_4_LOGO_HASH_VERIFICATION.csv`).
  - Logos 1–8 represent well-known major clients: Reliance, Blue Star, VIBGYOR, Waaree, Continuum, Saint-Gobain, SRM University, L&T.
  - Logos 9–22 represent regional developers, logistics parks, and PEB suppliers.
  - The external Claude audit suggested deleting logos 9–22 as potential placeholders.
* **Question for Management:**
  Does AARAA have ongoing relationships and permission to display all 22 partner logos? Should all 22 remain in the rotating marquee, or should logos 9–22 be replaced with named clients?
* **Recommendation:** **Retain all 22 logos** as verified in Batch 4 until marketing provides an updated client roster with written permissions.

---

#### 5. Partner Section Header Wording
* **Current Status in Code:**
  - Section heading at line 1190 is: `"Our Trusted Partners"`
  - External audit suggests: `"Clients & Project Partners"`
* **Question for Management:**
  Do you prefer the current title (`"Our Trusted Partners"`) or the proposed descriptor (`"Clients & Project Partners"`)?
* **Recommendation:** `"Clients & Project Partners"` is commercially precise and avoids implying formal joint-venture partnerships where vendor/client relationships exist.

---

#### 6. ISO Certification Data for Indexable Text
* **Current Status in Code:**
  - The site features a video presentation of the ISO certificate (`/assets/video/aaraa_ISO_certificate_v2.mp4`).
  - To improve SEO indexability, search engines benefit from crawlable text listing the exact standards.
* **Question for Management:**
  Please provide:
  1. Exact standards held (e.g. ISO 9001:2015, ISO 14001:2015, ISO 45001:2018).
  2. Certificate registration number(s).
  3. Accredited certification body / registrar.
* **Recommendation:** Do not publish specific certificate numbers until verified copies are supplied by AARAA management.

---

#### 7. Formal Customer Testimonials
* **Current Status in Code:**
  - No client testimonials are currently published on the homepage.
* **Question for Management:**
  Does AARAA possess approved written client endorsements (Client Name, Designation, Company, Quote) for publication on the homepage?
* **Recommendation:** Defer creating a testimonials section until approved customer quotes are provided.

---

#### 8. Terms of Use Document
* **Current Status in Code:**
  - The footer contains a link to `Terms of use.` pointing to `href="#"`.
  - While a comprehensive Privacy Policy exists (`/aaraa-privacy-policy`), there is currently no standalone `terms-of-use.html`.
* **Question for Management:**
  Does AARAA intend to publish a separate Terms of Use document, or should the footer link route to the existing Privacy Policy?
* **Recommendation:** Update link to `/aaraa-privacy-policy` until legal counsel supplies an approved Terms of Use agreement.

---
*Submitted for AARAA Management Review and Confirmation.*
