/**
 * CV source data — extracted from the attached Gazi_CV.pdf (3 pages, produced by
 * Acrobat PDFMaker for Word) and cross-referenced against the fiverr-cv generator
 * that already existed in this workspace.
 *
 * Extraction method: PyMuPDF text layer + embedded-image dump.
 *
 * ---------------------------------------------------------------------------
 * DELIBERATELY EXCLUDED — this data is a PUBLIC portfolio site, so the private
 * fields present in the source PDF are intentionally NOT modelled anywhere:
 *
 *   NID number (1495159640)          father's name / mother's name
 *   date of birth (7 Sept 1990)      present address (road/building/flat/thana)
 *                                    permanent address (village/post office)
 *                                    all 5 referees: names, phone numbers, emails
 *
 * The source PDF was written as a job-application document, not as a public
 * profile. Publishing an NID number or a home address on a crawlable site is a
 * real identity-theft exposure, so those fields are out of scope by design.
 * Contact details that he *intends* to be reached at (email, phone/WhatsApp,
 * LinkedIn, GitHub, Facebook) are included.
 * ---------------------------------------------------------------------------
 */

export type SeedEmploymentType = "FULL_TIME" | "PART_TIME";

export interface SeedProfile {
  fullName: string;
  headline: string;
  subheadline: string;
  summary: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedinUrl: string;
  githubUrl: string;
  facebookUrl: string;
  messengerUsername: string;
  seoTitle: string;
  seoDescription: string;
}

export interface SeedExperience {
  slug: string;
  title: string;
  company: string;
  companyUrl: string | null;
  employmentType: SeedEmploymentType;
  location: string | null;
  /** ISO date (YYYY-MM-DD) — the PDF gives exact days, e.g. "15th OCT, 2024". */
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
}

export interface SeedEducation {
  school: string;
  degree: string;
  field: string | null;
  startYear: number;
  endYear: number;
  details: string | null;
}

export interface SeedSkill {
  name: string;
  category: string;
}

export interface SeedCertification {
  name: string;
  issuer: string;
  issuedOn: string | null;
  url: string | null;
}

export interface SeedProject {
  slug: string;
  title: string;
  summary: string;
  body: string;
  role: string | null;
  client: string | null;
  year: number | null;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  featured: boolean;
  /** Provenance of this row — helps me keep the seed honest and auditable. */
  source: "pdf" | "fiverr-cv";
}

/* --------------------------------------------------------------- profile --- */

export const PROFILE: SeedProfile = {
  fullName: "Gazi Monir-Uz-Zaman",
  headline: "Senior Laravel & React Full-Stack Developer",
  subheadline:
    "8+ years building web, mobile and industrial systems — ERP, HRM, supply chain, e-commerce and SCADA.",
  // The PDF's "About Me" is a generic 2017-era objective statement ("Seeking a
  // challenging position in the IT Sector..."). The fiverr-cv ABOUT is the same
  // person writing about himself today, so that is what the site uses.
  summary:
    "Senior full-stack developer with 8+ years of experience building web and mobile applications " +
    "for businesses. I specialize in Laravel & PHP (bug fixes, APIs, e-commerce, ERP modules), React " +
    "(admin dashboards, SPAs, frontend integration), Flutter (Android apps with Laravel/REST backends), " +
    "and Node.js (REST APIs and real-time features). I have delivered production systems including " +
    "multi-vendor e-commerce, food delivery platforms, inventory/ERP tools, live chat (WebRTC), and " +
    "enterprise HRM & supply chain software. I deliver clean maintainable code, fast replies, clear " +
    "updates, and on-time delivery.",
  location: "Dhaka, Bangladesh",
  email: "ciphercall@gmail.com",
  phone: "+8801710272659",
  whatsapp: "+8801710272659",
  linkedinUrl: "https://www.linkedin.com/in/gazi-apu-12a16ba6",
  githubUrl: "https://github.com/ciphercall",
  facebookUrl: "https://facebook.com/apufirestl",
  messengerUsername: "apufirestl",
  seoTitle: "Gazi Monir-Uz-Zaman — Senior Laravel & React Full-Stack Developer",
  seoDescription:
    "Portfolio of Gazi Monir-Uz-Zaman, senior full-stack developer: Laravel, React, Flutter and Node.js. " +
    "8+ years delivering ERP, HRM, supply-chain, e-commerce and industrial SCADA systems.",
};

/* ------------------------------------------------------------ experience --- */

export const EXPERIENCES: SeedExperience[] = [
  {
    slug: "peoples-poultry-hatchery-senior-software-developer",
    title: "Senior Software Developer",
    company: "People's Poultry & Hatchery Limited",
    companyUrl: null,
    employmentType: "FULL_TIME",
    location: "Bangladesh",
    startDate: "2024-10-15",
    endDate: null,
    isCurrent: true,
    summary:
      "Building and maintaining the enterprise systems that run a poultry and hatchery operation end to end.",
    bullets: [
      "Build and maintain enterprise Laravel and React systems including HRM, supply chain, and attendance workflows.",
      "Design REST APIs, integrate Flutter mobile attendance with JWT backends, and support PostgreSQL/MySQL production databases.",
      "Ship Docker-based deployments and production support for ERP/SCM modules.",
    ],
    tags: ["Laravel", "React", "PostgreSQL", "Docker", "Flutter", "JWT"],
  },
  {
    slug: "bayshore-communications-senior-developer-team-lead",
    title: "Senior Developer Team-Lead",
    company: "Bayshore Communications Ltd",
    companyUrl: null,
    employmentType: "FULL_TIME",
    location: "Dhaka, Bangladesh",
    startDate: "2023-12-15",
    endDate: null,
    isCurrent: true,
    summary:
      "Leading web and mobile delivery, including decentralized blockchain products.",
    bullets: [
      "Lead development of web and mobile applications using React, Node.js, and MongoDB.",
      "Coordinate team delivery, code review, and client-facing timelines for product features.",
      "Contributed to decentralized web/mobile features including React, React Native, and real-time Node.js services.",
    ],
    tags: ["React", "React Native", "Node.js", "MongoDB", "Team Lead"],
  },
  {
    slug: "syscon-engineering-senior-software-plc-developer",
    title: "Senior Software & PLC Developer",
    company: "Syscon Engineering Limited",
    companyUrl: null,
    employmentType: "FULL_TIME",
    location: "Chattogram, Bangladesh",
    startDate: "2022-04-07",
    endDate: "2023-12-01",
    isCurrent: false,
    summary:
      "Industrial software: PLC programming paired with web interfaces for monitoring and control.",
    bullets: [
      "Developed industrial software and web interfaces for PLC/SCADA environments (Siemens PLC-1214C, OPC-UA).",
      "Built React and Node-RED integrations with MongoDB for monitoring and control workflows.",
      "Delivered production-ready automation and web application features for engineering clients.",
    ],
    tags: ["PLC", "SCADA", "OPC-UA", "React", "Node-RED", "MongoDB"],
  },
  {
    slug: "chittagong-soft-project-manager",
    title: "Project Manager",
    company: "Chittagong Soft Limited",
    companyUrl: null,
    employmentType: "PART_TIME",
    location: "Chattogram, Bangladesh",
    startDate: "2021-07-01",
    endDate: "2024-09-07",
    isCurrent: false,
    summary:
      "Ran client projects end to end while staying hands-on in the code.",
    bullets: [
      "Managed and developed Laravel applications including food delivery (CallBien) and OCR-based inventory (GlamourGlow).",
      "Delivered REST API based online shop solutions (PHP, Ajax, jQuery) for international clients.",
      "Handled client communication, scope, and on-time project delivery.",
    ],
    tags: ["Laravel", "PHP", "Project Management", "Client Delivery"],
  },
  {
    slug: "anazbd-full-stack-laravel-developer",
    title: "Full-Stack Laravel Developer",
    company: "Anazbd Corporation",
    companyUrl: null,
    employmentType: "FULL_TIME",
    location: "Chattogram, Bangladesh",
    startDate: "2020-10-01",
    endDate: "2022-02-26",
    isCurrent: false,
    summary: "Multi-vendor e-commerce platform work, from catalog to admin.",
    bullets: [
      "Developed a multi-vendor e-commerce platform with Laravel and Ajax.",
      "Implemented admin features, catalog flows, and production bug fixes.",
      "Maintained MySQL-backed application features for live business use.",
    ],
    tags: ["Laravel", "PHP", "MySQL", "E-commerce"],
  },
  {
    slug: "alchemy-software-junior-software-developer",
    title: "Junior Software Developer",
    company: "Alchemy Software Limited",
    companyUrl: null,
    employmentType: "FULL_TIME",
    location: "Chattogram, Bangladesh",
    startDate: "2017-04-01",
    endDate: "2020-09-30",
    isCurrent: false,
    summary:
      "Where it started: real-time communication systems and full-stack client work.",
    bullets: [
      "Built real-time live chat applications with Node.js, WebRTC, Socket.IO, and MongoDB.",
      "Worked on full-stack web features and production support for client projects.",
      "Grew from junior developer into delivering production Node.js and web systems.",
    ],
    tags: ["Node.js", "WebRTC", "Socket.IO", "MongoDB"],
  },
];

/* ------------------------------------------------------------- education --- */

export const EDUCATIONS: SeedEducation[] = [
  {
    school: "IDB-BISEW",
    degree: "Diploma (Post-graduation) in Enterprise Systems Analysis & Design",
    field: "C#.NET",
    startYear: 2016,
    endYear: 2017,
    details: null,
  },
  {
    school: "East Delta University",
    degree: "MBA",
    field: "Human Resource Management",
    startYear: 2013,
    endYear: 2015,
    details: null,
  },
  {
    school: "University of Science and Technology Chittagong",
    degree: "B.A. (Hons) in English",
    field: "English",
    startYear: 2008,
    endYear: 2012,
    details: null,
  },
];

/* ---------------------------------------------------------------- skills --- */

export const SKILLS: SeedSkill[] = [
  { name: "PHP", category: "Backend" },
  { name: "Laravel", category: "Backend" },
  { name: "Node.js", category: "Backend" },
  { name: "Express.js", category: "Backend" },
  { name: "REST API", category: "Backend" },
  { name: "API Integration", category: "Backend" },
  { name: "C#", category: "Backend" },
  { name: "ASP.NET", category: "Backend" },

  { name: "JavaScript", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "React", category: "Frontend" },
  { name: "HTML5 / CSS3", category: "Frontend" },

  { name: "Flutter", category: "Mobile" },
  { name: "React Native", category: "Mobile" },

  { name: "MySQL", category: "Database" },
  { name: "PostgreSQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "SQL Server", category: "Database" },

  { name: "PLC Programming", category: "Industrial" },
  { name: "SCADA", category: "Industrial" },
  { name: "OPC-UA", category: "Industrial" },

  { name: "Docker", category: "Tooling" },
  { name: "WebRTC", category: "Tooling" },
  { name: "Socket.IO", category: "Tooling" },
  { name: "Networking", category: "Tooling" },

  { name: "Python", category: "Languages" },
  { name: "Rust", category: "Languages" },
];

/* -------------------------------------------------------- certifications --- */

export const CERTIFICATIONS: SeedCertification[] = [
  {
    name: "Programming in HTML5 with JavaScript and CSS3 (Vendor Exam 70-480)",
    issuer: "Microsoft",
    issuedOn: null,
    url: null,
  },
];

/* -------------------------------------------------------------- projects --- */

export const PROJECTS: SeedProject[] = [
  {
    slug: "peoples-erp",
    title: "Enterprise ERP & Supply Chain Platform",
    summary:
      "The systems running a live poultry and hatchery business: HRM, supply chain, inventory and attendance in one platform.",
    body:
      "A production ERP covering human resources, supply chain and attendance for a poultry and hatchery group.\n\n" +
      "### What it does\n\n" +
      "- HRM workflows — employee records, zones, sectors, markets and dealers\n" +
      "- Supply chain — vendors, purchase orders, stock ledgers and sales sync\n" +
      "- Attendance — device-sourced punches reconciled against manual entries and leave\n" +
      "- Mobile — a Flutter attendance app talking to JWT-secured REST APIs\n\n" +
      "### Engineering notes\n\n" +
      "Docker-based deployments with a PostgreSQL primary and MySQL for the HRM side. " +
      "The API layer is Laravel with a custom RBAC catalogue, and the front ends are React SPAs.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Laravel", "React", "PostgreSQL", "MySQL", "Docker", "Flutter"],
    featured: true,
    source: "pdf",
  },
  {
    slug: "swop",
    title: "SWOP — Web3 Marketplace & NFT Platform",
    summary:
      "A Web3 platform for wallet-based contact sharing, token swapping and a decentralized NFT marketplace, with a React/Next.js frontend and a Node.js/MongoDB backend.",
    body:
      "### Problem / Context\n\n" +
      "A decentralized application spanning web and mobile: exchange contact details, swap tokens, and trade NFTs without a central operator.\n\n" +
      "### What it does\n\n" +
      "- Wallet-based contact sharing between users\n" +
      "- Token swapping across supported chains\n" +
      "- A decentralized NFT marketplace with minting and trading\n" +
      "- Real-time chat and media sharing\n\n" +
      "### Engineering notes\n\n" +
      "React/Next.js web client and a Flutter/React Native mobile client over Node.js/Express services " +
      "with Socket.IO channels, Solana/Ethereum program interaction through Metaplex, Privy wallet auth, " +
      "XMTP messaging, MongoDB storage, Redis caching, and Stripe/Firebase integrations.\n\n" +
      "### Stack\n\n" +
      "React, Next.js, Node.js, Express.js, MongoDB, Redis, Socket.IO, Solana, Ethereum, Metaplex, Privy, XMTP.",
    role: "Senior Developer Team-Lead",
    client: "Bayshore Communications Ltd",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/Travisswop/swop-app-backend",
    techStack: [
      "React",
      "Next.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Redis",
      "Socket.IO",
      "Solana",
      "Ethereum",
      "Metaplex",
      "Privy",
      "XMTP",
    ],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "live-chat-application",
    title: "Real-Time Live Chat",
    summary:
      "Low-latency browser-to-browser chat with presence, built directly on WebRTC.",
    body:
      "A real-time communication product built before hosted chat APIs were the default choice.\n\n" +
      "### Engineering notes\n\n" +
      "WebRTC handled the media path while Socket.IO carried signalling and presence; " +
      "MongoDB stored conversation history and user state on a Node.js backend.",
    role: "Junior Software Developer",
    client: "Alchemy Software Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Node.js", "WebRTC", "Socket.IO", "MongoDB"],
    featured: false,
    source: "pdf",
  },
  {
    slug: "anazbd-multivendor-ecommerce",
    title: "Multi-Vendor E-Commerce",
    summary:
      "A marketplace where many vendors sell through one storefront and one admin.",
    body:
      "A multi-vendor commerce platform covering vendor onboarding, catalog management and order flow.\n\n" +
      "### Engineering notes\n\n" +
      "Laravel with Ajax-driven admin interfaces on MySQL, including catalog hierarchies and " +
      "per-vendor product ownership.",
    role: "Full-Stack Laravel Developer",
    client: "Anazbd Corporation",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Laravel", "PHP", "MySQL", "Ajax"],
    featured: false,
    source: "pdf",
  },
  {
    slug: "sales-accounting-erp",
    title: "Sales & Accounting ERP",
    summary:
      "Sales, ledger and accounts in one system, with reporting on top.",
    body:
      "An ERP covering sales and accounting workflows with a React interface and a " +
      "PostgreSQL-backed Laravel API.\n\n" +
      "### Engineering notes\n\n" +
      "React front end, Laravel API, PostgreSQL storage, with Python used for reporting and data work.",
    role: null,
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["React", "Laravel", "PostgreSQL", "Python"],
    featured: false,
    source: "pdf",
  },
  {
    slug: "glamourglow-inventory-ocr",
    title: "GlamourGlow — OCR Inventory Management",
    summary:
      "Reads supplier email into structured orders — OCR at the front door of an inventory system.",
    body:
      "An order-profiling and inventory management system that turns incoming email into structured data.\n\n" +
      "### What it does\n\n" +
      "- Pulls orders from Gmail via the Gmail API\n" +
      "- OCRs attachment content into structured line items\n" +
      "- Profiles and manages the resulting inventory\n\n" +
      "### Engineering notes\n\n" +
      "Laravel and jQuery application over the Gmail API with an OCR pipeline for document ingestion.",
    role: "Project Manager",
    client: "Chittagong Soft Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Laravel", "jQuery", "Gmail API", "OCR"],
    featured: true,
    source: "pdf",
  },
  {
    slug: "callbien-food-delivery",
    title: "CallBien — Food Delivery Service",
    summary: "A food delivery service: menu, orders, delivery flow.",
    body:
      "A food delivery platform built on Laravel with a jQuery front end.\n\n" +
      "### Engineering notes\n\n" +
      "Order lifecycle management, menu and vendor handling, and delivery assignment on MySQL.",
    role: "Project Manager",
    client: "Chittagong Soft Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Laravel", "jQuery", "MySQL"],
    featured: false,
    source: "pdf",
  },
  {
    slug: "the-furniture-singapore",
    title: "The Furniture Singapore",
    summary:
      "A REST-API-driven online shop delivered for an international client.",
    body:
      "A RESTful API based online shop built for a Singapore-based furniture retailer.\n\n" +
      "### Engineering notes\n\n" +
      "PHP API endpoints consumed by an Ajax/jQuery storefront, delivered directly with the client.",
    role: "Project Manager",
    client: "Chittagong Soft Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["PHP", "Ajax", "jQuery", "REST API"],
    featured: false,
    source: "pdf",
  },
  {
    slug: "siemens-plc-1214c",
    title: "Siemens PLC-1214C Monitoring & Control",
    summary:
      "PLC control logic paired with a web dashboard for live plant monitoring.",
    body:
      "Industrial automation work combining PLC programming with a web application for monitoring and control.\n\n" +
      "### Engineering notes\n\n" +
      "- Ladder and SCL logic on a Siemens PLC-1214C\n" +
      "- An OPC-UA bridge exposing plant signals to software\n" +
      "- A React dashboard fed through Node-RED, with MongoDB for history",
    role: "Senior Software & PLC Developer",
    client: "Syscon Engineering Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Siemens PLC", "Ladder", "SCL", "OPC-UA", "React", "Node-RED", "MongoDB"],
    featured: false,
    source: "pdf",
  },
  {
    slug: "employee-attendance-app",
    title: "Biometric Attendance & HR Suite (PPHL)",
    summary:
      "Biometric attendance & HR system: ZKTeco device integration, face-recognition mobile app, HR admin panel.",
    body:
      "### Problem / Context\n\n" +
      "A poultry/hatchery group needed HR and attendance across devices and field staff.\n\n" +
      "### What it does\n\n" +
      "- ZKTeco device integration (ADMS push protocol), attendance reports, geo trails\n" +
      "- Android face-registration check-in/out, geo tracking, device approval\n" +
      "- HR admin panel (React) + ERP backend (Laravel) with ZKTeco automation monolith\n" +
      "- Multi-app APIs, FCM push, OTA updates\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 8/13 backends, React frontends, Flutter mobile with on-device face recognition, ZKTeco ADMS.\n\n" +
      "### Outcome / Value\n\n" +
      "Biometric attendance system — strong differentiator for HR/enterprise clients.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/PPHL-ERP/pphl_erp",
    techStack: ["Laravel", "React", "Flutter", "MySQL", "PostgreSQL", "ZKTeco", "JWT"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "dropship-marketplace",
    title: "DropshipBD — Multi-Supplier E-Commerce Marketplace",
    summary: "A complete multi-vendor marketplace: Laravel API, React admin, Next.js storefront, Flutter app, and Docker deploy.",
    body:
      "### Problem / Context\n\n" +
      "A multi-supplier dropshipping business needed one platform spanning catalog, payments, orders, and delivery across web and mobile.\n\n" +
      "### What it does\n\n" +
      "- Multi-supplier catalog with adapter framework\n" +
      "- Payments (COD + SSLCommerz) with per-supplier restrictions\n" +
      "- Orders, offers/coupons, reviews, geo/shipping\n" +
      "- React admin (RBAC, bilingual EN/BN), Next.js SEO storefront (ISR), Flutter mobile app with OTA updates\n" +
      "- One-origin Docker deploy + GitHub Actions to VPS\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 13 API with permission middleware and cross-domain contracts; React 18 admin; Next.js 16 storefront; Flutter mobile; Docker/edge nginx.\n\n" +
      "### Outcome / Value\n\n" +
      "End-to-end marketplace delivery reusable as a Fiverr 'full e-commerce suite' gig.",
    role: "Full-Stack Developer",
    client: "DropshipBD",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/dropship_backend",
    techStack: ["Laravel", "React", "Next.js", "Flutter", "PostgreSQL", "Docker", "SSLCommerz"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "pphl-supply-chain",
    title: "PPHL Supply Chain Management (SCM)",
    summary: "Enterprise procurement-to-inventory system: RFQ, PO, GRN, QC, stock ledger with serials, production/BOM, reports.",
    body:
      "### Problem / Context\n\n" +
      "A poultry/hatchery group needed an auditable supply chain from requisition to payment, with serialized stock.\n\n" +
      "### What it does\n\n" +
      "- Full procurement chain: RFQ, quotation, PO, GRN, QC, supplier invoice, vendor return, payments\n" +
      "- Partitioned stock ledger with serial registry, custody, issues/returns/reversals\n" +
      "- Production/BOM/work orders, quarantine/repair/scrap buyers\n" +
      "- QC departments/standards, stock insights & flow trace\n" +
      "- RBAC permission catalog, dashboards & financial/production/vendor/inventory reports\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 12 + PostgreSQL with partitioned stocks/ledgers; React 18/Vite/MUI frontend; 75+ docs.\n\n" +
      "### Outcome / Value\n\n" +
      "Deep, demoable enterprise SCM backend+frontend for manufacturing/logistics clients.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/PPHL-ERP/Backend_Supply_Chain_Management",
    techStack: ["Laravel", "React", "PostgreSQL", "Docker", "JWT"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "pphl-farm-hatchery",
    title: "Peoples Farm & Hatchery ERP",
    summary: "Multi-tenant poultry farm & hatchery ERP with batch genealogy stock ledger and 9-stage hatchery workflow.",
    body:
      "### Problem / Context\n\n" +
      "Greenfield ERP for farm and hatchery operations requiring traceable batch genealogy.\n\n" +
      "### What it does\n\n" +
      "- Multi-tenant (company/farm) RBAC\n" +
      "- Stock ledger with batch genealogy, master data (farms, sheds, breeds, products, UOM)\n" +
      "- 9-stage hatchery workflow: intake → incubation → hatch → dispatch\n" +
      "- Performance/lineage reports\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 12, PHP 8.2, PostgreSQL, JWT; StockLedgerService sole writer; fail-closed tenancy; 47 tests; Docker staging with auto-update.\n\n" +
      "### Outcome / Value\n\n" +
      "Niche agri/poultry vertical with clean, well-documented architecture.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/PPHL-ERP/peoples_farm_and_hatchery_backend",
    techStack: ["Laravel", "PostgreSQL", "Docker", "JWT"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "hms-hospital",
    title: "Hospital Management System (HMS)",
    summary: "Full hospital ERP: patients, appointments, billing, procedures, ZKTeco biometrics, Agora telemedicine, AI scribe.",
    body:
      "### Problem / Context\n\n" +
      "A hospital needed unified clinical, admin, HR, and procurement operations with telemedicine.\n\n" +
      "### What it does\n\n" +
      "- Patient records, consent forms, appointments, doctor/nurse modules\n" +
      "- Pharmacy/drug, lab, radiology, OT, CSSD, dental 3D tooth selector\n" +
      "- ZKTeco biometric attendance, Agora video consultations, OpenAI AI scribe + voice\n" +
      "- Role/permission system, export v2, automated backups\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 12 MVC + Blade; modular routes; custom permission/menu sync; Vite assets; Tailwind/Alpine.\n\n" +
      "### Outcome / Value\n\n" +
      "Healthcare ERP with telemedicine — strong freelance/enterprise value.",
    role: "Senior Software Developer",
    client: "MedPro IT",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/medproit/hms",
    techStack: ["Laravel", "PHP", "MySQL", "Tailwind", "Alpine.js", "Vite", "OpenAI", "Agora"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "scada-ems",
    title: "SCADA / EMS Control Center",
    summary: "Browser-based SCADA for industrial power & flow meters: RBAC, topology-driven UI, PDF reports, automailing.",
    body:
      "### Problem / Context\n\n" +
      "An industrial plant needed browser-based monitoring of PM5300 power/flow meters with role-based access.\n\n" +
      "### What it does\n\n" +
      "- RBAC (engineer/operator/superadmin) with OTP for superadmin\n" +
      "- Topology-driven sidebar; 17-measurement meter pages with gauges/charts/grids\n" +
      "- Manual + automated PDF reports with email delivery\n" +
      "- DB size badge, operational refresh, 5 themes, obfuscated secure build\n\n" +
      "### Engineering notes\n\n" +
      "Next.js 16 App Router monolith with route handlers; Prisma 7 + MySQL; simulated telemetry persisted; polling only when visible.\n\n" +
      "### Outcome / Value\n\n" +
      "Enterprise EMS/SCADA dashboard — high-ticket industrial client showcase.",
    role: "Senior Software & PLC Developer",
    client: "Syscon Engineering Limited",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/scada_control_center",
    techStack: ["Next.js", "React", "Prisma", "MySQL", "Tailwind", "Framer Motion", "pdf-lib", "Nodemailer"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "nuvista-inspection",
    title: "Nuvista Inspection Desktop (HMI)",
    summary: "Desktop HMI for automated visual inspection: Tauri + React + Python CV sidecar + camera SDK.",
    body:
      "### Problem / Context\n\n" +
      "A manufacturing line needed a desktop HMI for automated visual inspection of vials/cosmetics.\n\n" +
      "### What it does\n\n" +
      "- Login, batch management, mechanical/inspection parameter tuning, audit trail\n" +
      "- 4 synthetic inspection stations; Hikrobot camera SDK with graceful demo fallback\n" +
      "- Camera views, Knapp tests, utility/settings; offline NSIS installer\n\n" +
      "### Engineering notes\n\n" +
      "Tauri 2.0 (Rust) shell + React 19 UI + Python FastAPI sidecar; OpenCV/NumPy; MongoDB; ~5 Hz production loop.\n\n" +
      "### Outcome / Value\n\n" +
      "Industrial desktop app with camera SDK + CV sidecar — niche, high-value manufacturing demo.",
    role: "Senior Software Developer",
    client: "Nuvista",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/nuvista-inspection-desktop",
    techStack: ["Tauri", "Rust", "React", "TypeScript", "Python", "FastAPI", "OpenCV", "MongoDB"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "ai-invoice-po",
    title: "AI Invoice-to-PO Matching",
    summary: "AI-powered accounts-payable automation: LLM invoice OCR, PO matching, discrepancy flagging, approval workflow.",
    body:
      "### Problem / Context\n\n" +
      "Manufacturers manually matching supplier invoice PDFs/images against purchase orders.\n\n" +
      "### What it does\n\n" +
      "- Extracts structured data from invoice PDFs/images via OpenRouter LLM\n" +
      "- Matches against POs, flags discrepancies, routes exceptions for human approval\n" +
      "- Dashboard, email digest, per-invoice AI cost tracking\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 12 API + React/Vite (TS) frontend + n8n orchestration + Mailpit; PostgreSQL 16; Docker Compose.\n\n" +
      "### Outcome / Value\n\n" +
      "AI-powered AP automation showcase for LLM extraction + human-in-the-loop workflows.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/ai-invoice-po-matching",
    techStack: ["Laravel", "React", "TypeScript", "PostgreSQL", "n8n", "OpenRouter", "Docker"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "cinematic-video-engine",
    title: "Cinematic Video Engine",
    summary: "Text-to-cinema pipeline: LLM scene parsing, TTS voiceover, FFmpeg assembly, multi-language subtitles.",
    body:
      "### Problem / Context\n\n" +
      "Turning researched text into cinema-quality 16:9 narrative videos with synchronized voiceovers.\n\n" +
      "### What it does\n\n" +
      "- Text → scenes (LLM or rule-based), cinematic prompt enhancement\n" +
      "- Multi-language TTS (edge-tts/Kokoro), pluggable video gen (Mock/Wan/Hunyuan/LTX)\n" +
      "- FFmpeg assembly, word-by-word subtitles, checkpoint/resume, dry run, publishing hook\n\n" +
      "### Engineering notes\n\n" +
      "Python 3.10+ CLI pipeline with provider plugins; Docker option for local video gen; zero-cost default stack.\n\n" +
      "### Outcome / Value\n\n" +
      "End-to-end AI video generation pipeline for content-automation clients.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/cinematic-video-engine",
    techStack: ["Python", "FFmpeg", "LLM", "TTS", "Docker"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "workflow-video-studio",
    title: "Workflow Video Studio",
    summary: "Automated HD workflow recorder + multilingual voiceover engine producing polished MP4s from live apps.",
    body:
      "### Problem / Context\n\n" +
      "Producing polished product-demo videos manually is slow and inconsistent.\n\n" +
      "### What it does\n\n" +
      "- Playwright 1920x1080 recording with animated cursor overlay and human-like interaction\n" +
      "- Per-stage segmented capture, bn-BD + en-US narration, FFmpeg compositing, ffprobe verification\n" +
      "- Workflow YAML (Zod) config; targets local Docker stacks or live URLs\n\n" +
      "### Engineering notes\n\n" +
      "Node 20/TS ESM pipeline (refresh → capture → normalize → narrate → compose → verify); Docker runner + fixture app.\n\n" +
      "### Outcome / Value\n\n" +
      "Automated product-demo video generation — unique automation asset for client onboarding/training.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/workflow-video-studio",
    techStack: ["Node.js", "TypeScript", "Playwright", "FFmpeg", "Docker", "Zod"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "weight-scale-connector",
    title: "Weight Scale Connector (Desktop)",
    summary: "Windows desktop weighbridge app: serial-port capture, printing, camera screenshots, backend sync.",
    body:
      "### Problem / Context\n\n" +
      "A poultry farm weigh-in station needed software to capture scale readings, print, and sync to backend.\n\n" +
      "### What it does\n\n" +
      "- Live weight capture (gross/tare/net) from serial indicator\n" +
      "- Transaction save/search/print, camera screenshots on save\n" +
      "- API sync to backend (weighing data, customers/vendors/sectors), multi-theme UI\n\n" +
      "### Engineering notes\n\n" +
      "Python 3.10/11 Tkinter/ttkbootstrap; PyInstaller one-file/one-folder builds; pywin32 printing; reportlab PDFs.\n\n" +
      "### Outcome / Value\n\n" +
      "Tangible hardware-integrated desktop tool with live demo value for weighbridge/poultry clients.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Python", "Tkinter", "pyserial", "PyInstaller", "reportlab"],
    featured: true,
    source: "fiverr-cv",
  },
  {
    slug: "pharma-qc-inspector",
    title: "Pharma Vial QC Desktop Inspector",
    summary: "Desktop computer-vision inspector for pharmaceutical vial trays: multi-defect detection, batch, .exe deploy.",
    body:
      "### Problem / Context\n\n" +
      "Pharma QC needed automated defect detection on vial trays (empty, missing label, deformed, mixed, low fill).\n\n" +
      "### What it does\n\n" +
      "- Multi-defect detection with configurable thresholds\n" +
      "- PyQt6 UI, drag-and-drop + batch processing, annotated result images\n" +
      "- Standalone single .exe deploy\n\n" +
      "### Engineering notes\n\n" +
      "Python 3.8+, PyQt6, OpenCV, NumPy, SciPy, scikit-image, Pillow; PyInstaller build; ~1-3s per image.\n\n" +
      "### Outcome / Value\n\n" +
      "Niche pharma QC automation desktop app sellable to manufacturing clients.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Python", "PyQt6", "OpenCV", "NumPy", "PyInstaller"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "hvac-bms",
    title: "HVAC / BMS Control Center",
    summary: "MERN building-management SCADA dashboard for AHUs, chillers, cooling towers with reports and email alerts.",
    body:
      "### Problem / Context\n\n" +
      "A facility needed browser-based supervision of plant units with SCADA-style telemetry.\n\n" +
      "### What it does\n\n" +
      "- Role-based login, dashboard, animated unit schematics, setpoint commands\n" +
      "- Reports (PDF/email), simulation liveliness, settings\n" +
      "- Docker stack + Cloudflare tunnel\n\n" +
      "### Engineering notes\n\n" +
      "MERN: React 19 + Vite + Tailwind frontend; Express + Mongoose + MongoDB 7 backend; Nodemailer, pdf-lib.\n\n" +
      "### Outcome / Value\n\n" +
      "HVAC/plant SCADA dashboard for facility-management clients.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["React", "Node.js", "Express", "MongoDB", "Docker", "Tailwind"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "dental-tooth-segmenter",
    title: "3D Dental Tooth Region Segmenter",
    summary: "Python tool annotating 3D tooth models (GLB/GLTF) into regions for a Laravel 3D viewer.",
    body:
      "### Problem / Context\n\n" +
      "Dental software needed annotated 3D tooth models (regions) consumable by a Laravel viewer.\n\n" +
      "### What it does\n\n" +
      "- 11 auto neck-based regions with adjustable neck\n" +
      "- Interactive OpenGL 3D viewer, custom Z-range region marking\n" +
      "- JSON sidecar export compatible with the Laravel viewer\n\n" +
      "### Engineering notes\n\n" +
      "Python Tkinter GUI + trimesh/pyglet OpenGL viewer; pygltflib; NumPy.\n\n" +
      "### Outcome / Value\n\n" +
      "3D dental model segmentation tool for medical/dental software clients.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Python", "Tkinter", "trimesh", "pyglet", "NumPy"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "fishmeaqua",
    title: "FishMeAqua — Aquaculture E-Commerce",
    summary: "Fish/aquaculture e-commerce site with install wizard and multi-gateway payments.",
    body:
      "### Problem / Context\n\n" +
      "An aquaculture business needed an e-commerce site with broad payment gateway support.\n\n" +
      "### What it does\n\n" +
      "- Product catalog, cart, checkout, campaigns, blog, support tickets, newsletters\n" +
      "- Multi-payment: PayPal, Stripe, Paystack, Razorpay, MercadoPago, and more\n" +
      "- Laravel modules, admin panel, page builder, multi-language\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 8 modular (nwidart), Blade, MySQL; 10+ payment SDKs.\n\n" +
      "### Outcome / Value\n\n" +
      "Aquaculture/fish marketplace e-commerce with multi-gateway payments.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Laravel", "PHP", "MySQL", "Blade"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "floating-print",
    title: "Floating Print Capture Utility",
    summary: "Native Win32 desktop utility: floating bubble captures tables from any app, OCR, PDF/print.",
    body:
      "### Problem / Context\n\n" +
      "Users needed to capture tables from any desktop app and print/save as PDF.\n\n" +
      "### What it does\n\n" +
      "- Always-on-top draggable bubble; click-to-target table-area selection\n" +
      "- Scrolling capture + vertical stitching; OCR hook; save PDF to Desktop / print directly\n" +
      "- Installer packaging + optional startup registration\n\n" +
      "### Engineering notes\n\n" +
      "C++17, Win32/GDI+, CMake, PowerShell build scripts; XP-friendly native code.\n\n" +
      "### Outcome / Value\n\n" +
      "Native Windows desktop capture/print utility with table extraction.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["C++", "Win32", "CMake"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "dxg-agency",
    title: "DXG Digital Agency Website",
    summary: "Marketing website for a digital agency: service pages, portfolio, blog, scheduling, contact automation.",
    body:
      "### Problem / Context\n\n" +
      "A digital agency needed a modern marketing site with scheduling and content management.\n\n" +
      "### What it does\n\n" +
      "- Service pages (audiovisual, graphics, production, event platform, experience design)\n" +
      "- Portfolio, events, blog, contact/quote forms, newsletter\n" +
      "- Consultation scheduling, Google Maps, EmailJS\n\n" +
      "### Engineering notes\n\n" +
      "Next.js 14 App Router, React 18, TypeScript, Tailwind, Framer Motion, Radix UI.\n\n" +
      "### Outcome / Value\n\n" +
      "Agency marketing website with scheduling, blog, and contact automation.",
    role: "Full-Stack Developer",
    client: "Bayshore Communications Ltd",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/BayshoreCommunication/dxg-website",
    techStack: ["Next.js", "React", "TypeScript", "Tailwind", "Framer Motion"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "on-demand-gatekeeper",
    title: "On-Demand Gatekeeper (Cost-Saving Proxy)",
    summary: "Reverse proxy that lazily boots a target Docker stack on first visit and tears down after idle.",
    body:
      "### Problem / Context\n\n" +
      "Idle Docker stacks waste resources on small VPS; needed lazy boot + teardown.\n\n" +
      "### What it does\n\n" +
      "- Countdown warming page, SSE progress stream\n" +
      "- Admin deploy/teardown endpoints, configurable idle timeout (default 5h)\n" +
      "- Windows service / scheduled task support\n\n" +
      "### Engineering notes\n\n" +
      "Node.js config-driven (env only); drives docker compose against host daemon; never modifies target.\n\n" +
      "### Outcome / Value\n\n" +
      "On-demand hosting proxy that cuts idle infra costs.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/on-demand-gatekeeper",
    techStack: ["Node.js", "Docker", "HTTP Proxy"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "rocket-launcher-ota",
    title: "Rocket Launcher (OTA Release Pipeline)",
    summary: "Self-hosted OTA publisher for Flutter APKs: split-per-ABI, SHA-256 manifests, prod/beta channels.",
    body:
      "### Problem / Context\n\n" +
      "Flutter apps needed self-hosted over-the-air updates without app stores.\n\n" +
      "### What it does\n\n" +
      "- Split-per-ABI APK publish, SHA-256 manifests, prod/beta channels with disjoint version bands\n" +
      "- Release tags, manifest JSON on GitHub Releases/Contents\n\n" +
      "### Engineering notes\n\n" +
      "PowerShell pipeline (publish-update.ps1) + GitHub Contents/Releases API.\n\n" +
      "### Outcome / Value\n\n" +
      "Self-hosted Flutter OTA update pipeline with SHA-256 manifests and channels.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/rocket-launcher",
    techStack: ["PowerShell", "GitHub API", "Flutter"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "pphl-accounts-erp",
    title: "PPHL Accounts ERP (Backend + Client)",
    summary: "Accounting/ledger ERP: sales, stock, orders, ledgers, reports, dashboards across poultry verticals.",
    body:
      "### Problem / Context\n\n" +
      "PPHL needed accounting and sales operations across egg/feed/chicks/live-bird/fertilizer verticals.\n\n" +
      "### What it does\n\n" +
      "- Accounting/ledger backend (Laravel) + rich React client\n" +
      "- Production, stock, orders, sales returns, bookings, transfers\n" +
      "- Ledgers (company/dealer/vendor/bank), journals, bank transfers, labour, HR settings\n" +
      "- Reports & dashboards, weight transactions, Tally/SCM export\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 10 API + React 18/Vite/Redux/PrimeReact client; MySQL/PostgreSQL.\n\n" +
      "### Outcome / Value\n\n" +
      "Accounting/ERP frontend with dashboards, ledgers, and multi-vertical reporting.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/PPHL-ERP/pphl_account-laravel",
    techStack: ["Laravel", "React", "MySQL", "Redux", "PrimeReact"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "scm-data-migration",
    title: "SCM Data-Migration Tooling",
    summary: "Python/Excel/Google Sheets tooling to import sector stock and vendor masters into SCM PostgreSQL.",
    body:
      "### Problem / Context\n\n" +
      "SCM needed bulk import of sector stock quantities and vendor/product categories from spreadsheets.\n\n" +
      "### What it does\n\n" +
      "- Generate per-sector Excel templates from SCM masters\n" +
      "- Extract/verify/import stock CSVs (dry-run matching, skip analysis)\n" +
      "- Vendor product-category dropdown generator for Google Sheets (650 vendors, 22 categories)\n\n" +
      "### Engineering notes\n\n" +
      "Python, openpyxl/pandas, PostgreSQL, Google Sheets/Apps Script, Laravel artisan import commands.\n\n" +
      "### Outcome / Value\n\n" +
      "ERP data-migration/import tooling and Google Sheets automation.",
    role: "Full-Stack Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Python", "PostgreSQL", "Excel", "Google Sheets"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "zkteco-attendance",
    title: "ZKTeco Attendance Automation",
    summary: "Laravel monolith for ZKTeco device automation: ADMS ingestion, reports, multi-app APIs, biometrics.",
    body:
      "### Problem / Context\n\n" +
      "A plant needed ZKTeco biometric attendance integrated with HR and mobile apps.\n\n" +
      "### What it does\n\n" +
      "- iClock/ADMS device ingestion, machine registry, attendance reports\n" +
      "- ZKTeco SenseFace 3A registration, geo trails, farm & dealer marketing\n" +
      "- Mobile public API (attendance, geo, FCM), cross-domain integration API\n" +
      "- Retention/prune tooling, ERP bridge\n\n" +
      "### Engineering notes\n\n" +
      "Laravel 13 monolith, Blade+Livewire, PostgreSQL, Redis, Docker (web/api/queue/scheduler).\n\n" +
      "### Outcome / Value\n\n" +
      "Hardware-integrated biometric timekeeping backend with ADMS protocol + multi-app APIs.",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: "https://zkteco.peoplesitsolution.online",
    repoUrl: "https://github.com/Tanvirshibli/zkteco-Automation-management-PPHL",
    techStack: ["Laravel", "PostgreSQL", "Redis", "Docker", "Livewire"],
    featured: false,
    source: "fiverr-cv",
  },
  {
    slug: "gazi-portfolio-companion-app",
    title: "Gazi Portfolio Companion App (Flutter)",
    summary: "Offline-first Android companion app consuming the portfolio API with content-hash refresh and OTA updates.",
    body:
      "### Problem / Context\n\n" +
      "A portfolio website needed a read-only mobile companion with offline resilience.\n\n" +
      "### What it does\n\n" +
      "- Home/career/work/case-study/CV/contact/settings screens\n" +
      "- Three-layer offline cache (disk/bundled seed/network), content-hash-gated refresh\n" +
      "- Aurora theme parity with web; OTA updates via rocket launcher\n\n" +
      "### Engineering notes\n\n" +
      "Flutter 3.41/Dart 3.11, Android; go_router, provider, cached_network_image, flutter_pdfview.\n\n" +
      "### Outcome / Value\n\n" +
      "Offline-first mobile client consuming a self-hosted API — resilient mobile UX demo.",
    role: "Full-Stack Developer",
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: "https://github.com/ciphercall/gazi-portfolio-app",
    techStack: ["Flutter", "Dart", "Android"],
    featured: false,
    source: "fiverr-cv",
  },
];
