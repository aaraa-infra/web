# Form IP & Geolocation Rollback Plan
**AARAA Infrastructure Next.js Platform**

**Date:** 23 November 2026  
**Document Classification:** Operational Safety & Disaster Recovery Plan  
**Target Release:** Global Form IP & Geolocation Enrichment Layer  

---

## 1. Executive Summary

This document defines the emergency procedures to instantly disable or revert the IP and geolocation enrichment layer in the event of an unforeseen production incident, third-party provider outage, or gateway disruption.

Because the system is engineered to be **additive and decoupled**, rollback can be performed with **zero downtime, zero data loss, and zero impact on core form submissions**.

---

## 2. Checkpoints & State Baseline

- **Pre-Enrichment Git Commit Hash:** `1145a86` (Gate 5 — Security Hardening)
- **Production Server Branch:** `main`
- **Protected Assets:**
  - `_asset_quarantine/` (1,404 assets)
  - 3D Scroll frames (1,500 canvas frames across 5 sectors)
  - 400 static and dynamic routes

---

## 3. Tier 1: Instant Non-Deployment Disabling (Fail-Open By Design)

If an external geolocation service (e.g. IPinfo or ip-api) suffers a global outage or network degradation:
- **No code deployment is required.**
- The built-in 1,500ms server timeout and 500ms client timeout automatically trigger fail-open mode.
- Forms automatically submit with default fallback values (`"Unavailable"`), ensuring **100% uninterrupted form delivery to FormBold and Gmail SMTP**.

---

## 4. Tier 2: Complete Code Rollback Procedure

If management mandates a complete reversal of the changes:

### Step 1: Discard Working Tree Changes
```bash
# Verify current modified files
git status

# Restore modified core API routes and scripts
git checkout app/api/submit/route.js app/api/vendor/route.js app/api/careers/apply/route.js lib/security-validation.js public/js/firebase-submit.js components/careers/ApplicationForm.js legacy-pages/construction/

# Remove newly created modules
rm -f lib/geolocation.js
rm -rf app/api/geo/
```

### Step 2: Recompile Production Build
```bash
npm run build
```
Verify that all 400 static pages compile successfully with zero errors.

### Step 3: Run Smoke Verification
Execute the baseline security test suite:
```bash
node scratch/audit/run_security_tests.js
```
Confirm all 9 core security tests pass.

---

## 5. Verification Checklist Post-Rollback

- [ ] `/api/submit` accepts and forwards submissions without metadata fields.
- [ ] `/api/vendor` dispatches standard SMTP email and FormBold submission.
- [ ] `/api/careers/apply` processes resumes and dispatches SMTP email.
- [ ] All 1,112 location pages submit without console errors.
- [ ] All 3D scroll canvas experiences remain operational.
- [ ] Quarantined assets remain undisturbed.
