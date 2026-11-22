# Upwork copy

Upwork's fields are short and keyword-filtered. Every block below fits its field limit.

---

## Title (70 characters max)

```
Full-Stack Engineer | Laravel · React/Next.js · PostgreSQL
```

The canonical title is longer than Upwork's field allows, so the overview opens with it instead:

```
Senior Full-Stack Software Engineer (9+ Yrs) | PHP/Laravel · React/Next.js · Node.js · PostgreSQL · Docker | Shipping Production SaaS & Enterprise Apps
```

## Hourly rate guidance

Aligned with the portfolio's positioning (9+ years, enterprise ERP + industrial + e-commerce):

| Profile | Rate |
| --- | --- |
| Core profile | USD 30–45 / hr |
| Specialised profile — ERP / supply chain | USD 40–55 / hr |
| Fixed-price ERP module | quote after scope call |

Do not open below USD 25/hr: the case studies are enterprise-grade and underpricing invites
mismatched expectations.

## Overview (5,000 characters max)

```
I build business software that people actually run their company on.

I am a senior full-stack developer with 9+ years of production experience, currently Project
Manager at a poultry and hatchery group where I lead the ERP the business operates on: HRM, supply
chain, inventory, accounts and biometric attendance, in one auditable Laravel 12 + React +
PostgreSQL platform with a Flutter mobile client.

WHAT I DO BEST

1. ERP and internal tools
   Procurement-to-inventory systems, HRM, accounting links, inventory with serial traceability. I
   have built the full chain: requisition, RFQ, purchase order, GRN, QC inspection, stock ledger,
   quarantine and release.

2. E-commerce and marketplaces
   Multi-vendor platforms end to end: Laravel API, React admin, Next.js SEO storefront, Flutter app,
   and a Docker deploy. Payments including SSLCommerz and COD, per-vendor rules, payouts, offers.

3. API and integration work
   REST APIs consumed by web and mobile clients, JWT auth, third-party integrations, device
   integrations (ZKTeco attendance punches over the ADMS protocol), and data migrations that
   reconcile counts instead of hoping.

4. Rescue and extension
   Existing Laravel or React systems that need a module built, a bug found, an upgrade finished or
   performance fixed — without rewriting what already works.

HOW I WORK

• I ask about the audit trail, the reconciliation and the month-end before I write the first model.
• I write code the next developer can read; I have inherited enough codebases to know the cost of
  cleverness.
• Clear updates, on-time delivery, no surprise scope changes.
• I work directly with the person who owns the outcome, not through layers.

TECH

Laravel, PHP, React, Next.js, Node.js, TypeScript, Flutter, PostgreSQL, MySQL, MongoDB, Docker, JWT,
REST APIs, Livewire, Tailwind CSS, Prisma, Python, WebRTC, Socket.IO.

Also available: industrial/PLC-adjacent software (Siemens PLC, OPC-UA, Node-RED dashboards) and
desktop tooling (Tauri, Electron, Python/Qt, Win32).

Send me the problem, not a spec — I will tell you what I would do and whether I am the right person
for it.
```

## Specialised profiles (Upwork allows several — one per service)

### 1. Laravel ERP & Business Systems (primary)

```
Title: Laravel ERP, HRM & Supply Chain Developer
Rate: USD 40–55 / hr
Overview:
Enterprise Laravel systems: procurement-to-inventory SCM, HRM, accounts, and inventory with serial
traceability. I have delivered a live ERP covering HRM, supply chain and attendance for a poultry
and hatchery group — Laravel 12, React, PostgreSQL and MySQL, with a Flutter mobile client — and a
separate SCM platform moving 1,000+ commits of my own work.
I design the ledger, the permission model and the workflow states first, because that is where ERP
projects fail.
```

### 2. React & Next.js Front-End

```
Title: React & Next.js Developer — Admin Dashboards and SEO Sites
Rate: USD 30–45 / hr
Overview:
React and Next.js front ends for data-heavy products: admin panels, ERP screens, dashboards and
SEO-focused marketing sites. I build the front end against a real API contract, not mock data, and I
keep tables, filters and forms usable at 20 columns and 50,000 rows.
Stack: React 18, Next.js (App Router), TypeScript, Tailwind, MUI, PrimeReact, Redux, Framer Motion.
```

### 3. E-commerce & Marketplace Builds

```
Title: Laravel + Next.js Marketplace Developer (Multi-Vendor)
Rate: USD 30–45 / hr
Overview:
Multi-vendor and multi-supplier marketplaces end to end: vendor onboarding, catalog, orders,
payouts, offers, payments (SSLCommerz, COD) and a storefront built for SEO. I deliver the API, the
admin, the storefront and the deploy as one system, with per-vendor business rules enforced in the
backend.
```

### 4. Flutter Mobile Apps (Laravel backends)

```
Title: Flutter Developer — Business Apps on Laravel/REST Backends
Rate: USD 25–40 / hr
Overview:
Flutter Android apps for internal business use: attendance with biometric punches, order and delivery
apps, and customer-facing apps on Laravel/REST backends with JWT auth. I also automate OTA release
pipelines, so updates do not mean a manual build ritual.
```

### 5. Bug Fixes, API Work & Rescue

```
Title: Laravel & PHP Bug Fixes, API Work and Legacy Rescue
Rate: USD 30–45 / hr
Overview:
Targeted fixes in existing Laravel/PHP and React systems: a failing integration, a slow query, a
broken upgrade, an API that needs adding to a live product. I read the existing code first and change
as little as the fix requires.
```

## Portfolio items (Upwork project entries)

Upwork's portfolio is not hard-capped, but a wall of eleven entries reads as unfocused. Use the five
in **Primary** by default, and swap in from **Alternates** when a job targets that discipline. Every
entry below is a real project on the site; nothing here is invented for the platform.

### Primary five

### PPHL Supply Chain Management (SCM)

```
Role: Project Manager & Lead Developer
Period: 2026 - Present
Client: People's Poultry & Hatchery Limited (enterprise, under NDA-friendly description)

Problem: procurement ran on requisition emails and an unauditable stock register, so receipted
quantity, inspected quality and available stock never matched.

Solution: a full procurement-to-inventory platform — requisition, RFQ, quotation, purchase order,
GRN, QC inspection with failed-item handling, and a stock ledger with serials, issue, transfer,
quarantine, release and wastage. Dashboards for procurement, receiving, inventory, quarantine and
recheck.

Stack: Laravel 12, React, PostgreSQL, Docker, JWT

Result: an auditable chain from request to stock, extended by data-migration tooling and ZKTeco
device integration.
```

### Enterprise ERP & Supply Chain Platform

```
Role: Senior Software Developer → Project Manager
Period: 2024 - Present

Problem: HR, supply chain, inventory and attendance ran on disconnected spreadsheets and a manual
register; headcount, stock and presence never agreed.

Solution: one platform covering HRM with a custom RBAC catalogue, supply chain, a partitioned
inventory ledger with serial registry and custody/quarantine flows, biometric attendance reconciled
against manual entries and leave, production with BOM and cost estimation, and a Flutter attendance
client on JWT-secured APIs.

Stack: Laravel, React, PostgreSQL, MySQL, Docker, Flutter

Result: one auditable platform replacing the fragmented tooling, with serialized stock traceability.
```

### SWOP — Web3 Marketplace

```
Role: Senior Developer Team-Lead
Period: 2024 - 2025
Client: Bayshore Communications Ltd

Problem: the client needed to trade both ordinary goods and on-chain digital assets in a single
product.

Solution: a marketplace with social feed, smart-site builder, QR transactions, wallet and analytics
views, and NFT minting and order management, on React/Next.js and a Node.js/MongoDB backend with
Solana, Ethereum and Metaplex integration.

Stack: React, Next.js, Node.js, MongoDB, Solana, Ethereum, WebSockets

Result: a production Web3 marketplace with web and desktop clients, handed over in February 2025.
```

### DropshipBD — Multi-Supplier Marketplace

```
Role: Full-Stack Developer
Period: 2026 - Present

Problem: a dropshipping business needed one platform spanning catalog, payments, orders and delivery
across web and mobile, with per-supplier restrictions and a bilingual admin.

Solution: Laravel API, React admin with RBAC and EN/BN UI, Next.js SEO storefront with ISR, Flutter
app with OTA updates, per-supplier catalog rules, COD and SSLCommerz payments, and a one-origin
Docker deploy with GitHub Actions to a VPS.

Stack: Laravel, React, Next.js, Flutter, PostgreSQL, Docker, SSLCommerz
```

### Siemens PLC-1214C Monitoring & Control

```
Role: Senior Software & PLC Developer
Period: 2022 - 2023
Client: Syscon Engineering Limited

Problem: a plant had control logic in the PLC but no way to monitor or act on it away from the panel.

Solution: ladder/SCL logic on a Siemens PLC-1214C, an OPC-UA bridge exposing plant signals, and a
React dashboard fed through Node-RED with MongoDB history — tag tiles, multi-series trends, switch
controls and an alarm list.

Stack: Siemens PLC, OPC-UA, React, Node-RED, MongoDB

Result: browser-based monitoring and control of a live PLC installation.
```

### Alternates — swap in by discipline

The industrial and machine-vision entries below are the differentiator on this platform: most
Upwork Laravel developers cannot show a PLC dashboard or a camera-inspection station.

#### SCADA / EMS Control Center — for industrial monitoring and energy jobs

```
Role: Senior Software & PLC Developer
Period: 2026
Client: Independent (continues the Syscon-era SCADA work)

Problem: industrial monitoring dashboards were rebuilt per installation, and energy and equipment
trends had no single control center that could also report and alert.

Solution: browser-based SCADA for PM5300 power and flow meters — RBAC with OTP, a topology-driven
sidebar, 17-measurement meter pages with gauges, charts and grids, manual and scheduled PDF reports
delivered by email, and a secure production build.

Stack: Next.js, React, Prisma, MySQL, Tailwind, pdf-lib, Nodemailer

Result: one reusable control center replacing per-site dashboards.
```

#### HVAC / BMS Control Center — for building-management and facility jobs

```
Role: Full-Stack Developer
Period: 2025
Client: Independent

Problem: building systems are monitored through many small local controllers, and operators need one
view of AHU, chiller and cooling-tower state to catch a problem before occupants do.

Solution: a MERN control center over AHU, chiller and cooling-tower plant — role-based login,
dashboard, animated unit schematics, setpoint commands, PDF and email reports, and a Docker stack
behind a Cloudflare tunnel.

Stack: React, Node.js, Express, MongoDB, Docker, Tailwind

Result: a single operational view of plant equipment on a standard web stack.
```

#### Nuvista Inspection Desktop (HMI) — for machine-vision and shop-floor jobs

```
Role: Senior Software Developer
Period: 2026
Client: Independent

Problem: a manufacturing line needed automated visual inspection of vials and cosmetics at the
station, running offline, with a camera SDK and real image processing.

Solution: a Tauri desktop shell with a React operator interface and a Python FastAPI vision sidecar
using OpenCV — login, batch management, parameter tuning, audit trail, camera views and multi-defect
detection with configurable thresholds, shipped as an offline installer.

Stack: Tauri, Rust, React, TypeScript, Python, FastAPI, OpenCV, MongoDB

Result: local-first inspection HMI combining a native shell with a Python vision service.
```

#### Pharma Vial QC Desktop Inspector — for pharmaceutical QC jobs

```
Role: Full-Stack Developer
Period: 2025
Client: Independent

Problem: vial inspection is visual and repetitive, so a manual check produces both misses and
inconsistent reject reasons.

Solution: a PyQt6 inspection station that captures a tray image and runs OpenCV multi-defect checks —
empty, missing label, deformed, mixed and low-fill — with configurable thresholds, batch processing,
annotated result images and a single-file .exe deploy.

Stack: Python, PyQt6, OpenCV, NumPy, PyInstaller

Result: consistent, recorded inspection decisions on the line instead of after it.
```

#### Biometric Attendance & HR Suite — for mobile and HR-tech jobs

```
Role: Project Manager
Period: 2026 - Present
Client: People's Poultry & Hatchery Limited

Problem: attendance was collected by biometric devices but reconciled by hand, and staff had no
self-service view of their own attendance, leave or payslips.

Solution: a Flutter Android client with check-in/out, geo trails, leave application, payslips, alerts
and a services screen, on JWT-secured Laravel APIs fed by ZKTeco device punches, with an automated
OTA release pipeline.

Stack: Flutter, Laravel, MySQL, PostgreSQL, ZKTeco, JWT

Result: the mobile half of the enterprise ERP, used daily by field staff.
```

#### Gazi Portfolio Companion App — for Flutter and offline-first jobs

```
Role: Full-Stack Developer
Period: 2026 - Present
Client: Independent

Problem: a portfolio is read on a phone, but a web page is not an app someone keeps on their home
screen — and a mobile client that blanks out on a weak connection is worse than none.

Solution: an offline-first Flutter Android client consuming a versioned REST API, with three-layer
caching (disk snapshot, bundled seed, network), content-hash-gated refresh and self-hosted OTA
updates.

Stack: Flutter, Dart, Android

Result: a resilient mobile client that opens instantly and never shows an empty screen.
```

## Proposals — opening lines that work

Use the client's own words, then one concrete parallel, then a scope question. Never open with
"Hi, I am a senior developer with 9+ years of experience."

```
You are moving procurement off spreadsheets and need the stock ledger to be auditable. I built
exactly that chain — requisition to RFQ to PO to GRN to QC to stock ledger — for a poultry group
where stock is serialized and quarantined. Two questions: how many warehouses, and does stock need
per-serial traceability or is per-batch enough?
```

```
Your Laravel app needs a vendor marketplace layer without a rewrite. I have delivered multi-vendor
catalogs with per-vendor payout rules on Laravel + Next.js. Can you show me the current order model?
That decides whether vendors can be added as a relation or need their own ledger.
```

## Contract guardrails

- Fixed-price ERP work: split into modules with a written acceptance criterion per module. Never
  quote a whole ERP as one fixed price.
- Always state what is out of scope: data entry, content, and device hardware setup.
- For migrations, quote the reconciliation report as a deliverable — it is what prevents disputes.
- Keep all milestones inside the same month boundaries you claim on the portfolio; do not let an
  Upwork contract date imply an employer you have not listed.
