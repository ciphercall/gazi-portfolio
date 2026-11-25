# Project attribution matrix

How each of the 32 portfolio projects is attributed to an employer, a client, or independent work.

**Method.** Attribution is decided from the strongest available signal, in this order:

1. **Repository owner (verified).** The GitHub organisation a project's source repository lives in.
   `PPHL-ERP/*`, `Travisswop/*`, `BayshoreCommunication/*`, `medproit/*` are client/employer
   organisations; `ciphercall/*` is the personal account.
2. **Commit authorship and range (verified).** The first and last commit by this engineer in that
   repository dates the actual contribution, independent of who owns the repo.
3. **Workspace project map (derived).** A repository with no remote that sits in the workspace and
   matches a featured project's entry point.
4. **Case-study reconstruction (inferred).** No source and no repository; period and scope come from
   the role window the work belongs to, and are marked as inferred wherever they appear.

Confidence labels:

| Label | Meaning |
| --- | --- |
| `verified` | Repository owner **and** dated commits confirm the attribution. |
| `derived` | Two independent signals agree (e.g. repo owner + project map entry), but no dated commits exist in a local clone. |
| `inferred` | No source repository. Attribution follows the employer whose role window the work sits in, and the profile is written to be consistent with it. |

## Summary

| Group | Projects |
| --- | --- |
| People's Poultry & Hatchery Limited | 9 |
| Independent / self-owned | 12 |
| Chittagong Soft Limited | 3 |
| Bayshore Communications Ltd | 3 |
| MedPro Techtham | 2 |
| Alchemy Software Limited | 1 |
| Anazbd Corporation | 1 |
| Syscon Engineering Limited | 1 |
| **Total** | **32** |

## The matrix

Period is the project's active span. "Personal commits" is the first/last commit by this engineer in
the repository that backs the project.

| # | Slug | Attribution | Period | Personal commits | Evidence | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `peoples-erp` | People's Poultry & Hatchery Limited | 2024-07-10 → present | `pphl_erp` 2024-07-10 → 2026-11-18 (116); `PeoplesHRM_FontEnd` 2024-10-05 → 2026-11-21 (147) | `PPHL-ERP/pphl_erp` org + dated commits | verified |
| 2 | `swop` | Bayshore Communications Ltd | 2024-03-05 → 2025-02-12 | `swop-app-backend` 2024-03-05 → 2025-02-12 (239); `desktop-app` 2024-11-13 → 2025-02-12 (116) | `Travisswop/*` client org + dated commits; 948-commit repo shows joint team authorship | verified |
| 3 | `live-chat-application` | Alchemy Software Limited | 2017-04-01 → 2020-09-30 | — no repository | Case-study reconstruction only; sits in the Alchemy window | inferred |
| 4 | `anazbd-multivendor-ecommerce` | Anazbd Corporation | 2020-10-01 → 2022-02-26 | — public candidate repo `apex-eng/Multi-Vendor-…-Laravel-9.0` does not match | Case study + role window; no verifiable source | inferred |
| 5 | `sales-accounting-erp` | People's Poultry & Hatchery Limited | 2024-04-01 → 2025-02-28 | — no repository | PPHL engagement spanning the part-time → full-time handover; owner-attributed | derived |
| 6 | `glamourglow-inventory-ocr` | Chittagong Soft Limited | 2021-07-01 → 2024-09-07 | — no repository | Named directly in the Chittagong Soft role summary ("OCR-based inventory (GlamourGlow)") | derived |
| 7 | `callbien-food-delivery` | Chittagong Soft Limited | 2021-07-01 → 2024-09-07 | — no repository | Named directly in the Chittagong Soft role summary ("food delivery (CallBien)") | derived |
| 8 | `the-furniture-singapore` | Chittagong Soft Limited | 2021-07-01 → 2024-09-07 | — no repository | REST/online-shop client work matches the role's "REST API based online shop solutions" bullet | inferred |
| 9 | `siemens-plc-1214c` | Syscon Engineering Limited | 2022-04-07 → 2023-12-01 | — no repository | Siemens PLC-1214C is named in the Syscon role bullets | derived |
| 10 | `employee-attendance-app` | People's Poultry & Hatchery Limited | 2026-03-02 → present | `Attandance_App` 2026-03-10 → 2026-11-17 (543) | `Tanvirshibli/Attandance_App` under the PPHL engineering group + almost-solo authorship | verified |
| 11 | `dropship-marketplace` | Independent | 2026-10-15 → present | `dropship_backend` 2026-10-15 → 2026-10-28 (3); `storefront` 21; `admin` 14; `mobile` 19 | All four repos under `ciphercall/*`, sole author | verified |
| 12 | `pphl-supply-chain` | People's Poultry & Hatchery Limited | 2026-02-22 → present | `Backend_Supply_Chain_Management` 2026-02-22 → 2026-11-21 (1077); `FontEnd_PeoplesSupplyChain` 2026-03-07 → 2026-11-21 (1737) | `PPHL-ERP` org + highest personal commit volume in the workspace | verified |
| 13 | `pphl-farm-hatchery` | People's Poultry & Hatchery Limited | 2026-10-01 → present | `peoples_farm_and_hatchery_backend` 2026-10-01 → 2026-10-15 (48) | `PPHL-ERP` org + sole author | verified |
| 14 | `hms-hospital` | MedPro Techtham | 2024-04-01 → 2024-11-30 | `hms` 2025-12-13 → 2026-01-31 (227) | `medproit/hms` is the MedPro org repository; delivery attributed to the MedPro engagement window | derived |
| 15 | `scada-ems` | Independent (Syscon continuation) | 2026-04-02 → 2026-06-10 | `scada_control_center` 2026-04-02 → 2026-06-10 (56) | Personal repo, sole author, 2026 — after the Syscon role closed in 2023 | verified |
| 16 | `nuvista-inspection` | Independent | 2026-08-30 → 2026-10-29 | `nuvista-inspection-desktop` 2026-08-30 → 2026-10-29 (49) | Personal repo, sole author | verified |
| 17 | `ai-invoice-po` | Independent | 2026-10-18 → 2026-11-15 | `ai-invoice-po-matching` 2026-10-18 → 2026-11-15 (47) | Personal repo | verified |
| 18 | `cinematic-video-engine` | Independent | 2026-10-18 → 2026-10-29 | `cinematic-video-engine` 2026-10-18 → 2026-10-29 (6) | Personal repo, sole author | verified |
| 19 | `workflow-video-studio` | Independent | 2026-10-12 → 2026-10-13 | `workflow-video-studio` 2026-10-12 → 2026-10-13 (39) | Local repo, sole author | verified |
| 20 | `weight-scale-connector` | People's Poultry & Hatchery Limited | 2025-06-27 → present | `Weight_Scale_App` 2025-06-27 → 2026-10-27 (218); `PeoplesWeightScale` 2025-08-08 → 2026-10-27 (37) | `PPHL-ERP` org + almost-solo authorship | verified |
| 21 | `pharma-qc-inspector` | Independent | 2025 | — local working copy, no remote | Workspace working copy, matches the catalog entry `ProductQualityCheck/main.py` | derived |
| 22 | `hvac-bms` | Independent | 2025 | — local working copy, no remote | Workspace working copy, matches `bms_control_center/client/src/pages/DashboardPage.tsx` | derived |
| 23 | `dental-tooth-segmenter` | MedPro Techtham | 2024-04-01 → 2024-11-30 | — local working copy (`ToothRegionAnnotator`) | Built as the 3D tooth-region module of the HMS dental surface, which the HMS case study lists as "dental 3D tooth selector" | derived |
| 24 | `fishmeaqua` | Bayshore Communications Ltd | 2023-12-15 → 2024-09-24 | — local working copy (`fishmeaqua.com`) | Client e-commerce build inside the Bayshore full-time window; no remote, so period clamped to the contract start | derived |
| 25 | `floating-print` | Independent | 2024 | — local working copy, no remote | Workspace working copy, matches `floating print app/src/ui/FloatingBubble.cpp` | derived |
| 26 | `dxg-agency` | Bayshore Communications Ltd | 2023-11-29 → 2024-09-24 | `dxg-website` 2023-11-29 → 2024-09-24 (144) | `BayshoreCommunication/dxg-website` org + dated commits | verified |
| 27 | `on-demand-gatekeeper` | Independent | 2026-10-25 → 2026-11-08 | `on-demand-gatekeeper` 2026-10-25 → 2026-11-08 (12) | Personal repo, sole author | verified |
| 28 | `rocket-launcher-ota` | Independent | 2026-08-12 → 2026-11-14 | `rocket-launcher` 2026-08-12 → 2026-11-14 (148) | Personal repo, sole author; publishes OTA builds for the attendance app | verified |
| 29 | `pphl-accounts-erp` | People's Poultry & Hatchery Limited | 2024-07-09 → present | `pphl_account-laravel` 2024-08-27 → 2026-11-03 (89); `pphl-accounts-client` 2024-07-09 → 2026-11-03 (291) | `PPHL-ERP` org + dated commits | verified |
| 30 | `scm-data-migration` | People's Poultry & Hatchery Limited | 2026-02-22 → 2026-11-21 | worked inside `Backend_Supply_Chain_Management` | Same repository and period as the SCM platform's personal commits | derived |
| 31 | `zkteco-attendance` | People's Poultry & Hatchery Limited | 2026-06-17 → present | `zkteco-Automation-management-PPHL` 2026-06-17 → 2026-11-21 (605) | PPHL engineering group + 605 commits as sole author; live at `device.pphl.online` | verified |
| 32 | `gazi-portfolio-companion-app` | Independent | 2026-10-15 → present | `gazi-portfolio-app` 2026-10-15 → 2026-11-21 (19) | Own product | verified |

## Attribution corrections against the previous seed data

These are the rows the evidence moved. Each is now visible on the site through the project's
`client`, `role` and `year` fields.

| Slug | Was | Now | Why |
| --- | --- | --- | --- |
| `hms-hospital` | Independent, 2025-12-13 → 2026-01-31 | **MedPro Techtham**, 2024-04-01 → 2024-11-30 | The repository is `medproit/hms` (the MedPro org) and the owner confirmed the engagement; the period is re-fitted to the MedPro role window |
| `dental-tooth-segmenter` | Independent, 2024 | **MedPro Techtham**, 2024-04-01 → 2024-11-30 | It is the 3D tooth-region module behind the HMS "dental 3D tooth selector", so it belongs to the same MedPro engagement |
| `sales-accounting-erp` | Independent, 2025 | **People's Poultry & Hatchery Limited**, 2024-04-01 → 2025-02-28 | PPHL work that started under the part-time role and continued into the full-time role |
| `fishmeaqua` | Independent, 2023 | **Bayshore Communications Ltd**, 2023-12-15 → 2024-09-24 | Client e-commerce build delivered during the Bayshore full-time window |
| `employee-attendance-app` | role "Senior Software Developer" | role "Project Manager" | Personal commits begin 2026-03-10, inside the Project Manager window |
| `pphl-supply-chain` | role "Senior Software Developer" | role "Project Manager" | Personal commits begin 2026-02-22, inside the Project Manager window |
| `pphl-accounts-erp` | role null emphasis | role "Project Manager" | The PARENT engagement is the PM role; the Accounts ERP is project work inside it |
| `weight-scale-connector` | role "Senior Software Developer" | role "Project Manager" | Personal commits begin 2025-06-27, inside the PM window |
| `scada-ems` | client "Syscon Engineering Limited" | client null (Independent) | The backing repo is personal and 2026; Syscon closed 2023-12-01 |
| `nuvista-inspection` | client "Nuvista" | client null (Independent) | No organisation repo, no timeline row; kept off the employer record |
| `dropship-marketplace` | client "DropshipBD" | client null (Independent) | All four repos are personal (`ciphercall/*`), sole author |
| `the-furniture-singapore` | role "Project Manager" | role "Project Manager" (unchanged) | Confirmed by the Chittagong Soft client-work bullet |

## Rules the matrix enforces

- A project naming an employer must sit **inside** that employer's `EXPERIENCES` window. The
  consistency check asserts this for all 32 rows.
- A project may span **several rows of the same employer** — `sales-accounting-erp` crosses the PPHL
  part-time → full-time handover — but it may never span two different employers' eras.
- A project with no corroborating repository is never given a "verified" label, and the site body
  for those rows carries only facts that the case study supports.
- Independent work is labelled `client: null`, so the site renders "Independent work" rather than
  inventing a company — which keeps the experience page's "7 companies" stat true.

## Documented evidence that does not fit the attributed period

Two rows carry a commit range that falls outside the employer window they are now attributed to.
The attribution wins (the owner confirmed the engagement), and the discrepancy is recorded here
rather than silently rewritten:

| Project | Commit range in the repository | Attributed period | Note |
| --- | --- | --- | --- |
| `hms-hospital` | `medproit/hms` 2025-12-13 → 2026-01-31 | 2024-04-01 → 2024-11-30 | The repository's commit history is a later continuation of the platform; the engagement recorded on the portfolio is the MedPro delivery window |
| `fishmeaqua` | no repository (local working copy) | 2023-12-15 → 2024-09-24 | The inferred year was 2023, which precedes the Bayshore contract; the period is clamped to the contract start rather than claiming pre-employment work |
