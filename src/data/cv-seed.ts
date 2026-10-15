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
    title: "SWOP — Decentralized Marketplace",
    summary:
      "A blockchain application for contact sharing, token swapping and a decentralized NFT marketplace.",
    body:
      "A decentralized application spanning web and mobile: exchange contact details, swap tokens, and trade NFTs without a central operator.\n\n" +
      "### What it does\n\n" +
      "- Contact sharing between wallets\n" +
      "- Token swapping\n" +
      "- A decentralized NFT marketplace\n\n" +
      "### Engineering notes\n\n" +
      "Built as a React web client and a React Native mobile client over Node.js/Express services " +
      "with WebSocket channels, Solana program interaction through Metaplex, and MongoDB storage.",
    role: "Senior Developer Team-Lead",
    client: "Bayshore Communications Ltd",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: [
      "React",
      "React Native",
      "Node.js",
      "Express.js",
      "WebSocket",
      "MongoDB",
      "Metaplex",
    ],
    featured: true,
    source: "pdf",
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
    title: "Employee Attendance Mobile App",
    summary:
      "A Flutter Android app for field attendance, syncing to JWT-secured REST backends.",
    body:
      "A Flutter attendance application used by field staff, including an OTA update channel " +
      "so deployed devices stay current.\n\n" +
      "### Engineering notes\n\n" +
      "- Flutter Android client talking to Laravel REST APIs over JWT\n" +
      "- Attendance capture reconciled against device and manual punch records\n" +
      "- Self-hosted over-the-air update publishing",
    role: "Senior Software Developer",
    client: "People's Poultry & Hatchery Limited",
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: ["Flutter", "JWT", "REST API", "Laravel"],
    featured: false,
    source: "fiverr-cv",
  },
];
