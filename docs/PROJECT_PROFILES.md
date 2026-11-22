# Project profiles

One profile per portfolio project: when it ran, the role held, the problem it solved, what it does,
the stack, and the outcome. Every profile is written so it can be reused on a CV, LinkedIn, Upwork,
Contra or Fiverr without contradicting the career timeline.

**Reading the confidence tags.** `verified` = backed by a repository owner and dated commits.
`derived` = two independent signals agree but no dated commits exist. `inferred` = no source
repository; the profile is written from the case study and constrained to the employer or period it
belongs to. Sections marked `Inferred —` are the parts of an `inferred` profile that exist to make
its case study complete, and are not claims of verifiable record on their own.

All periods sit inside the windows in [`CAREER_TIMELINE.md`](./CAREER_TIMELINE.md). Attribution
reasoning is in [`PROJECT_ATTRIBUTION_MATRIX.md`](./PROJECT_ATTRIBUTION_MATRIX.md).

---

## 1. Enterprise ERP & Supply Chain Platform — `peoples-erp`

- **Period:** 2024-07-10 → present · **Engagement:** People's Poultry & Hatchery Limited (part-time
  Senior Software Developer, then full-time Project Manager from 2024-10-15)
- **Role:** Senior Software Developer → Project Manager
- **Stack:** Laravel, React, PostgreSQL, MySQL, Docker, Flutter · `verified`
- **Problem:** HR, supply chain, inventory and attendance ran on disconnected spreadsheets and a
  manual register, so headcount, stock and presence never agreed and monthly reporting was rebuilt
  by hand.
- **What it does:** HRM workflows with a custom RBAC catalogue; supply chain with vendors, POs,
  stock ledgers and material issues/returns; a partitioned inventory ledger with serial registry,
  custody, quarantine, repair and scrap; biometric attendance reconciled against manual entries and
  leave; production with BOM/work orders and cost estimation; a Flutter attendance client on
  JWT-secured REST; and dashboards with financial, production, vendor and inventory reporting.
- **Outcome:** One auditable platform replacing the fragmented tooling, with serialized stock
  traceability and a mobile attendance client — the flagship enterprise case study.

## 2. SWOP — Web3 Marketplace & NFT Platform — `swop`

- **Period:** 2024-03-05 → 2025-02-12 · **Engagement:** Bayshore Communications Ltd (full-time,
  then part-time handover)
- **Role:** Senior Developer Team-Lead
- **Stack:** React, Next.js, Node.js, Express, MongoDB, Redis, Socket.IO, Solana, Ethereum,
  Metaplex, Privy, XMTP · `verified`
- **Problem:** A marketplace needed to trade both ordinary goods and on-chain digital assets in one
  product, with wallets, minting, feeds and settlement in a single interface.
- **What it does:** social feed, smart-site builder, QR transactions, wallet and analytics views,
  NFT minting and order management, all on one authenticated shell.
- **Scale note:** the backend repository carries 948 commits with joint team authorship; this
  engineer contributed 239 of them across the integration, wallet and product surfaces as the
  team-lead.
- **Outcome:** A production Web3 marketplace with web and desktop clients, handed over in February
  2025.

## 3. Real-Time Live Chat — `live-chat-application`

- **Period:** 2017-04-01 → 2020-09-30 · **Engagement:** Alchemy Software Limited (full-time)
- **Role:** Junior Software Developer
- **Stack:** Node.js, WebRTC, Socket.IO, MongoDB · `inferred`
- **Problem:** Client projects needed real-time messaging and calling before hosted chat APIs were
  the default choice, so the transport and presence layer had to be built and operated directly.
- **What it does:** three-pane messenger with conversation list, threaded chat with presence,
  group chat and one-to-one video calling over WebRTC signalling.
- **Inferred —** the shipped feature set mirrors the standard WebRTC + Socket.IO architecture of the
  period: room-based signalling, MongoDB message history, and presence tracked per socket.
- **Outcome:** The foundation of the real-time skill set that later carried into Node.js API work at
  every subsequent role.

## 4. Multi-Vendor E-Commerce — `anazbd-multivendor-ecommerce`

- **Period:** 2020-10-01 → 2022-02-26 · **Engagement:** Anazbd Corporation (full-time)
- **Role:** Full-Stack Laravel Developer
- **Stack:** Laravel, PHP, MySQL, Ajax · `inferred`
- **Problem:** A commerce business needed many independent vendors on one storefront, with each
  vendor managing its own catalog, orders and payouts while the platform kept a consistent
  storefront.
- **What it does:** vendor onboarding and scoping, catalog management, order lifecycle per vendor,
  payouts, reviews and platform settings.
- **Inferred —** the admin surface follows the standard Laravel multi-vendor pattern of the era:
  vendor-scoped Eloquent relations, Ajax-driven product grids, and a role-scoped admin panel.
- **Outcome:** A live multi-vendor platform with admin and vendor workflows, maintained in
  production through the role.

## 5. Sales & Accounting ERP — `sales-accounting-erp`

- **Period:** 2024-04-01 → 2025-02-28 · **Engagement:** People's Poultry & Hatchery Limited
  (started part-time, continued under the full-time role)
- **Role:** Full-Stack Developer
- **Stack:** React, Laravel, PostgreSQL, Python · `derived`

This is the one project on the portfolio that spans two consecutive roles at the same employer: it
began during the PPHL part-time engagement and carried into the full-time Project Manager role after
the October 2024 handover.
- **Problem:** A business ran sales on spreadsheets and accounting in separate books, so the two
  never reconciled without manual work.
- **What it does:** sales workflows (orders, invoices, customer records), double-entry ledger with
  journals and bank transfers, and reporting dashboards over both sides.
- **Inferred —** scope and architecture follow the standard SME accounting pattern: an immutable
  journal as the ledger source of truth, with sales documents posting into it rather than holding
  their own balances.
- **Outcome:** A unified sales-plus-accounting pattern reusable for SME clients.

## 6. GlamourGlow — OCR Inventory Management — `glamourglow-inventory-ocr`

- **Period:** 2021-07-01 → 2024-09-07 · **Engagement:** Chittagong Soft Limited (part-time client
  engagement)
- **Role:** Project Manager
- **Stack:** Laravel, jQuery, Gmail API, OCR · `derived`
- **Problem:** Supplier orders arrived by email and were re-typed into the inventory system by hand
  — slow and error-prone.
- **What it does:** reads incoming supplier email, runs OCR over the attachments, structures the
  result into orders, and queues anything uncertain for human review before it touches stock.
- **Outcome:** The manual re-typing step disappeared from the client's ordering workflow, and the
  platform became a named reference in the Chittagong Soft engagement.

## 7. CallBien — Food Delivery Service — `callbien-food-delivery`

- **Period:** 2021-07-01 → 2024-09-07 · **Engagement:** Chittagong Soft Limited (part-time client
  engagement)
- **Role:** Project Manager
- **Stack:** Laravel, jQuery, MySQL · `derived`
- **Problem:** A food-delivery operator needed ordering, menu management and delivery tracking in
  one platform instead of phone orders and a paper log.
- **What it does:** searchable menu with categories, cart and checkout, offers and coupons, order
  tracking, and restaurant-side menu management.
- **Outcome:** A delivery platform delivered end to end for the client, from scope through
  production support — a named reference in the Chittagong Soft engagement.

## 8. The Furniture Singapore — `the-furniture-singapore`

- **Period:** 2021-07-01 → 2024-09-07 · **Engagement:** Chittagong Soft Limited (part-time client
  engagement)
- **Role:** Project Manager
- **Stack:** PHP, Ajax, jQuery, REST API · `inferred`
- **Problem:** A Singapore furniture retailer needed a catalogue-driven online shop without an
  off-the-shelf platform's constraints.
- **What it does:** REST-API-backed catalogues by room, filtering, product detail, and a paginated
  storefront.
- **Inferred —** the build follows the REST plus Ajax storefront pattern named in the Chittagong
  Soft role: a PHP API serving JSON to jQuery-driven pages, rather than a server-rendered framework
  shop.
- **Outcome:** An international REST-API client delivery, matching the role's "online shop solutions
  for international clients" scope.

## 9. Siemens PLC-1214C Monitoring & Control — `siemens-plc-1214c`

- **Period:** 2022-04-07 → 2023-12-01 · **Engagement:** Syscon Engineering Limited (full-time)
- **Role:** Senior Software & PLC Developer
- **Stack:** Siemens PLC, Ladder, SCL, OPC-UA, React, Node-RED, MongoDB · `derived`
- **Problem:** A plant had control logic in the PLC but no way to see or act on it away from the
  panel.
- **What it does:** ladder and SCL logic on a PLC-1214C, an OPC-UA bridge exposing plant signals, a
  React dashboard fed through Node-RED, tag tiles, multi-series trends, switch controls and a
  scrolling alarm list.
- **Outcome:** Browser-based monitoring and control of a live PLC installation — the industrial
  case study that defines the PLC/SCADA specialty.

## 10. Biometric Attendance & HR Suite (PPHL) — `employee-attendance-app`

- **Period:** 2026-03-02 → present · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Laravel, React, Flutter, MySQL, PostgreSQL, ZKTeco, JWT · `verified`
- **Problem:** Attendance was collected by biometric devices but reconciled by hand, and staff had
  no self-service view of their own attendance, leave or payslips.
- **What it does:** a Flutter Android client with check-in/out, a translucent hours triptych, leave
  application, payslips, alerts and a services screen, talking to JWT-secured Laravel APIs fed by
  ZKTeco device punches.
- **Commit note:** 543 personal commits, essentially sole authorship, 2026-03-10 → 2026-11-17.
- **Outcome:** The mobile half of the ERP, and the client's daily attendance workflow.

## 11. DropshipBD — Multi-Supplier E-Commerce Marketplace — `dropship-marketplace`

- **Period:** 2026-10-15 → present · **Engagement:** Independent product (own venture)
- **Role:** Full-Stack Developer
- **Stack:** Laravel, React, Next.js, Flutter, PostgreSQL, Docker, SSLCommerz · `verified`
- **Problem:** A multi-supplier dropshipping business needed catalog, payments, orders and delivery
  across web and mobile, with per-supplier restrictions and a bilingual admin.
- **What it does:** multi-supplier catalog with an adapter framework and per-supplier restrictions;
  COD and SSLCommerz payments with per-supplier-type rules; orders, offers, reviews, geo/shipping
  and delivery assignment; a React admin with RBAC and EN/BN UI; a Next.js SEO storefront with ISR;
  a Flutter app with OTA updates; and a one-origin Docker deploy with edge nginx and GitHub Actions.
- **Outcome:** A complete marketplace suite reusable as a template for future e-commerce builds.

## 12. PPHL Supply Chain Management (SCM) — `pphl-supply-chain`

- **Period:** 2026-02-22 → present · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Laravel, React, PostgreSQL, Docker, JWT · `verified`
- **Problem:** Procurement ran on requisition emails and a stock register that nobody could audit,
  so receipted quantity, inspected quality and available stock never matched.
- **What it does:** requisition → RFQ → quotation → purchase order → GRN → QC inspection → stock
  ledger, with stock issue, transfer, quarantine, release and wastage, plus dashboards for
  procurement, receiving, inventory, quarantine and recheck.
- **Commit note:** the largest personal contribution in the workspace — 1,077 commits on the
  backend and 1,737 on the front end.
- **Outcome:** An auditable procurement-to-inventory system, extended by the data-migration tooling
  and the ZKTeco integration.

## 13. Peoples Farm & Hatchery ERP — `pphl-farm-hatchery`

- **Period:** 2026-10-01 → present · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Laravel, PostgreSQL, Docker, JWT · `verified`
- **Problem:** Farm and hatchery operations needed the same auditable platform as the rest of the
  group, with batch, flock and production semantics that generic ERP modules do not model.
- **What it does:** a Laravel API service modelling the hatchery and farm domain, deployed as a
  containerised service on the shared stack.
- **Outcome:** The newest service in the platform, extending the ERP to the production end of the
  business.

## 14. Hospital Management System (HMS) — `hms-hospital`

- **Period:** 2024-04-01 → 2024-11-30 · **Engagement:** MedPro Techtham (part-time)
- **Role:** Senior Software Developer
- **Stack:** Laravel, PHP, MySQL, Tailwind, Alpine.js, Vite, OpenAI, Agora · `derived`
- **Problem:** A hospital needed front office, nursing, doctor, procurement, radiology, laboratory,
  insurance, corporate and accounting modules in one system rather than per-department tools.
- **What it does:** 31 modules behind a single launcher — patient flow from front office through
  consultation, diagnostics and billing, with insurance and corporate settlement.
- **Commit note:** 227 personal commits in a 1,943-commit multi-author repository, i.e. a specific
  module surface inside a larger team build. The repository's commit history continues into 2026 as
  the platform was extended; the engagement recorded here is the MedPro delivery window.
- **Outcome:** A scheduled multi-module hospital platform delivered to a January 2026 deadline.

## 15. SCADA / EMS Control Center — `scada-ems`

- **Period:** 2026-04-02 → 2026-06-10 · **Engagement:** Independent build, continuing the Syscon-era
  SCADA work
- **Role:** Senior Software & PLC Developer
- **Stack:** Next.js, React, Prisma, MySQL, Tailwind, Framer Motion, pdf-lib, Nodemailer · `verified`
- **Problem:** Industrial monitoring dashboards were built per installation and could not be reused;
  energy and equipment trends needed one control center that could report and alert.
- **What it does:** live equipment and energy dashboards, trends, alarms, and PDF/email reporting
  over a Prisma-modelled MySQL store.
- **Note on attribution:** this is a personal productisation of the monitoring pattern built at
  Syscon, not Syscon work — the repository is personal and the commits are 2026, well after that
  role closed.
- **Outcome:** A reusable control-center product, and the bridge from PLC/SCADA work into a modern
  TypeScript stack.

## 16. Nuvista Inspection Desktop (HMI) — `nuvista-inspection`

- **Period:** 2026-08-30 → 2026-10-29 · **Engagement:** Independent engagement
- **Role:** Senior Software Developer
- **Stack:** Tauri, Rust, React, TypeScript, Python, FastAPI, OpenCV, MongoDB · `verified`
- **Problem:** A manufacturing client needed a shop-floor inspection station: camera input, visual
  checking and operator feedback, on a machine that may not have a reliable network.
- **What it does:** a Tauri desktop shell with a React operator interface, a Python FastAPI sidecar
  doing OpenCV inspection, and MongoDB for inspection records.
- **Outcome:** A local-first inspection HMI combining a native shell with a Python vision service —
  the pattern most industrial clients ask for and least often get.

## 17. AI Invoice-to-PO Matching — `ai-invoice-po`

- **Period:** 2026-10-18 → 2026-11-15 · **Engagement:** Independent product work
- **Role:** Full-Stack Developer
- **Stack:** Laravel, React, TypeScript, PostgreSQL, n8n, OpenRouter, Docker · `verified`
- **Problem:** Accounts teams match supplier invoices to purchase orders by hand; the three-way
  match (invoice, PO, goods receipt) is slow and quietly wrong.
- **What it does:** ingests invoices, extracts line items, matches them to open purchase orders and
  receipts, and surfaces exceptions for human review rather than silently posting them.
- **Outcome:** An automation that removes the bulk of manual matching while keeping a human decision
  on every discrepancy.

## 18. Cinematic Video Engine — `cinematic-video-engine`

- **Period:** 2026-10-18 → 2026-10-29 · **Engagement:** Independent tooling
- **Role:** Full-Stack Developer
- **Stack:** Python, FFmpeg, LLM, TTS, Docker · `verified`
- **Problem:** Producing narrated product and demo video means scripting, voiceover, capture,
  editing and encoding — five tools and a lot of manual timing.
- **What it does:** turns a script into a rendered video: LLM-driven scene planning, text-to-speech
  narration, FFmpeg composition and containerised rendering.
- **Outcome:** A repeatable video pipeline used for delivery documentation and client demos.

## 19. Workflow Video Studio — `workflow-video-studio`

- **Period:** 2026-10-12 → 2026-10-13 · **Engagement:** Independent tooling
- **Role:** Full-Stack Developer
- **Stack:** Node.js, TypeScript, Playwright, FFmpeg, Docker, Zod · `verified`
- **Problem:** Recording a real application workflow by hand produces inconsistent video, and
  hand-written capture scripts break whenever the UI moves.
- **What it does:** takes a declarative workflow definition, drives it with Playwright, captures the
  run and encodes a finished video.
- **Outcome:** A declarative capture engine — the workflow is data, so a UI change means editing the
  definition, not the code.

## 20. Weight Scale Connector (Desktop) — `weight-scale-connector`

- **Period:** 2025-06-27 → present · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Python, Tkinter, pyserial, PyInstaller, reportlab · `verified`
- **Problem:** Weighbridge readings were written on paper and re-keyed into stock records, so weights
  and inventory disagreed and weigh slips were inconsistent.
- **What it does:** a packaged Windows desktop app that reads the scale over a serial port, captures
  each weighing, prints a slip and pushes the record into stock.
- **Outcome:** Weighbridge data became digital at the source — the classic small industrial utility
  that removes a daily manual step.

## 21. Pharma Vial QC Desktop Inspector — `pharma-qc-inspector`

- **Period:** 2025 · **Engagement:** Independent build
- **Role:** Full-Stack Developer
- **Stack:** Python, PyQt6, OpenCV, NumPy, PyInstaller · `derived`
- **Problem:** Vial inspection is visual and repetitive, and a manual check produces both misses and
  inconsistent reject reasons.
- **What it does:** a PyQt6 desktop station that captures a vial image, runs OpenCV checks and
  records pass/fail with a reason.
- **Inferred —** the inspection set follows standard pharma visual QC: particulates, fill level,
  seal and cosmetic defects, with the operator confirming each rejection.
- **Outcome:** Consistent, recorded inspection decisions on the line instead of after it.

## 22. HVAC / BMS Control Center — `hvac-bms`

- **Period:** 2025 · **Engagement:** Independent build
- **Role:** Full-Stack Developer
- **Stack:** React, Node.js, Express, MongoDB, Docker, Tailwind · `derived`
- **Problem:** Building systems are monitored through many small local controllers; operators need
  one view of AHU, chiller and cooling-tower state to spot a problem before occupants do.
- **What it does:** a MERN control center over AHU, chiller and cooling-tower equipment, with live
  state, setpoints and history.
- **Inferred —** the equipment model follows the usual BMS grouping: per-equipment point lists,
  setpoint writes with audit, and trend history for each point.
- **Outcome:** A single operational view of plant equipment on a standard web stack.

## 23. 3D Dental Tooth Region Segmenter — `dental-tooth-segmenter`

- **Period:** 2024-04-01 → 2024-11-30 · **Engagement:** MedPro Techtham (part-time) — built
  alongside the HMS dental module
- **Role:** Senior Software Developer
- **Stack:** Python, Tkinter, trimesh, pyglet, NumPy · `derived`

This tool is the annotation half of the HMS dental surface, which the case study lists as the
"dental 3D tooth selector": it produces the region data the hospital platform's 3D viewer consumes.
- **Problem:** Marking tooth regions on a scanned 3D dental mesh is slow and inconsistent when done
  by hand across many scans.
- **What it does:** loads a mesh, lets the operator trace and label tooth polygons, and stores the
  regions as reusable annotation data.
- **Inferred —** the workflow follows the standard annotation loop: load, view in pyglet, trace
  polygons, name the tooth, save, next scan — with the mesh geometry handled by trimesh.
- **Outcome:** Faster, consistent region labelling feeding downstream dental analysis.

## 24. FishMeAqua — Aquaculture E-Commerce — `fishmeaqua`

- **Period:** 2023-12-15 → 2024-09-24 · **Engagement:** Bayshore Communications Ltd (full-time)
- **Role:** Senior Developer Team-Lead
- **Stack:** Laravel, PHP, MySQL, Blade · `derived`
- **Problem:** An aquaculture business sold live stock and equipment over phone and chat, with no
  catalogue, no online enquiry trail and no way to keep availability current.
- **What it does:** a Blade-rendered catalogue with product and category pages, enquiry flow and an
  admin for stock and content.
- **Inferred —** the structure follows a conventional Laravel storefront: routed Blade views,
  Eloquent catalog models, and a lightweight admin rather than a full e-commerce platform.
- **Outcome:** A working online storefront for a niche supplier, built and maintained as a small
  Laravel delivery.

## 25. Floating Print Capture Utility — `floating-print`

- **Period:** 2024 · **Engagement:** Independent utility
- **Role:** Full-Stack Developer
- **Stack:** C++, Win32, CMake · `derived`
- **Problem:** Capturing exactly the right window region for a print or report job means fiddling
  with a screen tool that gets in the way; a floating capture bubble keeps the action one click
  away.
- **What it does:** a small always-on-top Win32 bubble that captures the region under it and hands
  the image to print or save.
- **Inferred —** the implementation follows standard Win32 practice: a layered topmost window, a GDI
  screen capture into a bitmap, and CMake for a portable build.
- **Outcome:** A native utility that removes the friction of repeated capture-and-print.

## 26. DXG Digital Agency Website — `dxg-agency`

- **Period:** 2023-11-29 → 2024-09-24 · **Engagement:** Bayshore Communications Ltd (full-time)
- **Role:** Senior Developer Team-Lead
- **Stack:** Next.js, React, TypeScript, Tailwind, Framer Motion · `verified`
- **Problem:** An agency's own site has to demonstrate the quality it sells, and needs to be
  editable by non-developers.
- **What it does:** a motion-led Next.js marketing site with service, work and contact sections,
  built for performance and SEO.
- **Commit note:** 144 personal commits in a 466-commit, three-author repository — lead
  contribution rather than sole authorship.
- **Outcome:** A production agency site and the Bayshore front-end reference build.

## 27. On-Demand Gatekeeper (Cost-Saving Proxy) — `on-demand-gatekeeper`

- **Period:** 2026-10-25 → 2026-11-08 · **Engagement:** Independent tooling
- **Role:** Full-Stack Developer
- **Stack:** Node.js, Docker, HTTP proxy · `verified`
- **Problem:** Always-on infrastructure costs money whether or not anyone is using it; a service
  that wakes on demand and idles when unused cuts that cost without changing how it is called.
- **What it does:** a small Node.js proxy in front of an on-demand service — it accepts the request,
  starts the backing service, forwards the request, and lets it idle out afterwards.
- **Outcome:** Lower running cost for intermittent workloads with no change to the client contract.

## 28. Rocket Launcher (OTA Release Pipeline) — `rocket-launcher-ota`

- **Period:** 2026-08-12 → 2026-11-14 · **Engagement:** Independent tooling for internal Android
  release work
- **Role:** Full-Stack Developer
- **Stack:** PowerShell, GitHub API, Flutter · `verified`
- **Problem:** Shipping a Flutter Android build to devices meant a manual build, version bump,
  release upload and update dance — and a reused build number breaks publishing entirely.
- **What it does:** automates the build-and-publish path: version bump, artifact build, GitHub
  Release creation and OTA metadata, with append-only build numbers.
- **Outcome:** One-command OTA releases for the attendance app, with no build-number collisions.

## 29. PPHL Accounts ERP (Backend + Client) — `pphl-accounts-erp`

- **Period:** 2024-07-09 → present · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Laravel, React, MySQL, Redux, PrimeReact · `verified`
- **Problem:** The accounts side and the supply chain side each held their own vendor and ledger
  data, so a vendor's balance depended on which system you asked.
- **What it does:** accounts backend and client covering ledgers, vouchers and reporting, with the
  supply chain pushing vendor ledgers into it so both sides agree.
- **Commit note:** 291 personal commits on the client and 89 on the backend, inside a
  multi-author team repository.
- **Outcome:** A single accounts record for the group, reconciled with procurement.

## 30. SCM Data-Migration Tooling — `scm-data-migration`

- **Period:** 2026-02-22 → 2026-11-21 · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Python, PostgreSQL, Excel, Google Sheets · `derived`
- **Problem:** Moving a live procurement business onto a new SCM meant carrying years of stock,
  vendor and vehicle records across without losing serials or opening balances.
- **What it does:** scripts that read legacy spreadsheets and sheets, normalise them, and load them
  into the SCM schema with reconciliation counts — including merged vehicle-stock handling.
- **Outcome:** A cutover with verifiable per-table counts instead of a hopeful one-off import.

## 31. ZKTeco Attendance Automation — `zkteco-attendance`

- **Period:** 2026-06-17 → present · **Engagement:** People's Poultry & Hatchery Limited
- **Role:** Project Manager
- **Stack:** Laravel, PostgreSQL, Redis, Docker, Livewire · `verified`
- **Problem:** ZKTeco devices push punches over their own protocol, but nothing translated those
  pushes into the HR system's attendance rules.
- **What it does:** an ADMS-protocol receiver and dashboard that ingests device punches, maps them
  to employees and shifts, and feeds the attendance engine — live at
  `zkteco.peoplesitsolution.online`.
- **Commit note:** 605 personal commits as sole author.
- **Outcome:** Device punches reach attendance automatically, removing the daily export-import step.

## 32. Gazi Portfolio Companion App (Flutter) — `gazi-portfolio-companion-app`

- **Period:** 2026-10-15 → present · **Engagement:** Independent product (own)
- **Role:** Full-Stack Developer
- **Stack:** Flutter, Dart, Android · `verified`
- **Problem:** A portfolio site is read on a phone, but a web page is not the same as an app someone
  keeps on their home screen.
- **What it does:** a Flutter Android client for the portfolio — projects, experience and contact —
  reading the same published data as the site.
- **Outcome:** A mobile entry point to the portfolio, and the Flutter skill set kept current.
