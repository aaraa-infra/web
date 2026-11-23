# Form IP & Geolocation Test Report
**AARAA Infrastructure Next.js Platform**

**Test Execution Date:** 23 November 2026  
**Test Harness:** `scratch/audit/run_form_geolocation_tests.js` & `scratch/audit/run_security_tests.js`  
**Test Environment:** Node.js v20+, Next.js 15.5.20 Production Build (`npx next start -p 3000`)  
**Overall Verdict:** **ALL 26 TESTS PASSED (100% SUCCESS RATE)**

---

## 1. Unit Test Matrix (`lib/geolocation.js`)

| Test ID | Test Category | Target Input | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UT-01** | Public IPv4 Validation | `103.21.244.2` | Returns `true` | `true` | **PASS** |
| **UT-02** | Public IPv6 Validation | `2404:6800:4007:80c::200e` | Returns `true` | `true` | **PASS** |
| **UT-03** | Private IP Rejection | `192.168.1.100`, `10.0.0.1`, `172.16.0.1` | Returns `false` | `false` | **PASS** |
| **UT-04** | Loopback Rejection | `127.0.0.1`, `::1` | Returns `false` | `false` | **PASS** |
| **UT-05** | Malformed IP Rejection | `999.999.999.999`, `invalid-string`, `""` | Returns `false` | `false` | **PASS** |
| **UT-06** | Header Priority Order | `cf-connecting-ip`, `x-vercel-forwarded-for`, `x-forwarded-for` | Selects `cf-connecting-ip` (`103.21.244.10`) | `103.21.244.10` | **PASS** |
| **UT-07** | Proxy Chain Parsing | `10.0.0.1, 192.168.1.1, 103.21.244.50, 10.0.0.2` | Skips private proxies; extracts leftmost public IP | `103.21.244.50` | **PASS** |
| **UT-08** | Live Geolocation Lookup | `8.8.8.8` | Returns valid country and city | Country: `US`, City: `Mountain View` | **PASS** |
| **UT-09** | In-Memory TTL Caching | `8.8.8.8` (immediate repeat call) | Instant response from cache (< 5ms) | 0 ms cache retrieval | **PASS** |
| **UT-10** | Fail-Open Bogon Fallback | `127.0.0.1` | Returns safe fallback with `"Local Development"` | `visitor_city: "Local Development"` | **PASS** |

---

## 2. Integration HTTP Server Test Matrix

| Test ID | Test Category | Target Route | Simulated Headers & Payload | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TH-01** | Geolocation API | `GET /api/geo` | `cf-connecting-ip: 8.8.8.8` | HTTP 200, JSON metadata with country/city | HTTP 200, Country: `US`, City: `Mountain View` | **PASS** |
| **TH-02** | Location Form | `POST /api/submit` | Location page payload (`amaravati`), `cf-connecting-ip: 103.21.244.2` | HTTP 200, `success: true`, submission ID generated | HTTP 200, `submission_id: AARAA-MWT3MKCX` | **PASS** |
| **TH-02-F** | File Verification | `public/local_submissions/` | Inspect `submission_AARAA-MWT3MKCX.json` | JSON contains complete `metadata.visitor_*` fields | `visitor_ip: "103.21.244.2"`, `visitor_city: "New York City"` verified | **PASS** |
| **TH-03** | Vendor Form | `POST /api/vendor` | Vendor payload (`Precast Concrete`), `x-vercel-ip: 8.8.8.8` | HTTP 200, `success: true`, sequential vendor ID | HTTP 200, `submission_id: AAVN20261123-002` | **PASS** |
| **TH-03-F** | File Verification | `public/local_submissions/` | Inspect `vendor_AAVN20261123-002.json` | JSON contains `metadata.visitor_*` and direct email body | `visitor_ip: "8.8.8.8"`, `visitor_city: "Mountain View"` verified | **PASS** |
| **TH-04** | Career Form | `POST /api/careers/apply` | Job application payload, `x-forwarded-for: 10.0.0.1, 8.8.8.8` | HTTP 200, `success: true`, sequential career ID | HTTP 200, `submission_id: AICR20261123-383` | **PASS** |
| **TH-04-F** | File Verification | `public/local_submissions/` | Inspect `careers_AICR20261123-383.json` | JSON contains `metadata.visitor_*` and direct email body | `visitor_ip: "8.8.8.8"`, `visitor_city: "Mountain View"` verified | **PASS** |

---

## 3. Security Regression Test Suite

All 9 security verification tests from Gate 5 were re-run against the production server:

| Security Test Case | Target Route | Attack Vector / Probe | Verdict | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-SEC-01** | `/` | Probing Content-Security-Policy-Report-Only | Header verified (1,112 chars) | **PASS** |
| **TC-SEC-02** | `/api/careers/apply` | Legitimate PDF upload | HTTP 200 Success | **PASS** |
| **TC-SEC-03** | `/api/careers/apply` | Disguised PE binary (`MZ` header) | HTTP 400 Rejected | **PASS** |
| **TC-SEC-04** | `/api/submit` | Disguised PHP web shell | HTTP 400 Rejected | **PASS** |
| **TC-SEC-05** | `/api/careers/apply` | MIME type spoofing | HTTP 400 Rejected | **PASS** |
| **TC-SEC-06** | `/api/submit` | 4.8 MB file exceeding 4.5 MB platform limit | HTTP 413 Rejected | **PASS** |
| **TC-SEC-07** | `/api/submit` | Rate limit throttling (6 rapid POSTs) | Throttled with HTTP 429 (`Retry-After: 595s`) | **PASS** |
| **TC-SEC-08** | `/api/careers/apply` | Genuine DOCX Office OpenXML package | HTTP 200 Success | **PASS** |
| **TC-SEC-09** | `/api/vendor` | Legitimate vendor registration regression | HTTP 200 Success | **PASS** |

---

## 4. Fail-Open & Edge Case Robustness

- **Provider Outage Simulation:** If the geolocation API is unreachable or returns a non-200 code, the lookup immediately falls back to secondary provider or returns `"Unavailable"` without throwing an unhandled exception.
- **Strict 1,500ms Timeout:** External lookup requests are bounded by `AbortController`. The client-side form fetch is bounded by a `Promise.race` with a 500ms ceiling, guaranteeing that visitor form submissions never experience noticeable latency.
- **Zero Client Impact:** No form submission was blocked, dropped, or corrupted across any test scenario.
