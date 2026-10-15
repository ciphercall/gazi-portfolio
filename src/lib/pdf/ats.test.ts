// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  CERTIFICATIONS,
  EDUCATIONS,
  EXPERIENCES,
  PROFILE,
  PROJECTS,
  SKILLS,
} from "../../data/cv-seed";
import { renderAtsCv } from "./ats";
import { ATS_SECTION_ORDER, formatDateRange, formatMonthYear } from "./content";
import type { CvSource } from "@/lib/queries";

/**
 * The point of the ATS variant is that a machine can read it.
 *
 * So this test does not inspect the markup that produced the PDF — it reads the
 * finished bytes the way an applicant tracking system would: it extracts the text
 * layer with pdf.js and asserts that the sections, jobs, companies and dates are
 * all in there, in the right order, as real selectable text. It also asserts the
 * thing that quietly ruins parsers, that the document contains no images at all.
 *
 * `pdfjs-dist` is the same engine a résumé parser is built on; if it can read
 * this file cleanly, so can the robot on the other end of a job application.
 */

/* -------------------------------------------------------------- fixture --- */

function fixtureSource(): CvSource {
  const skills: { category: string; items: string[] }[] = [];
  for (const skill of SKILLS) {
    const group = skills.find((entry) => entry.category === skill.category);
    if (group) group.items.push(skill.name);
    else skills.push({ category: skill.category, items: [skill.name] });
  }

  return {
    profile: {
      fullName: PROFILE.fullName,
      headline: PROFILE.headline,
      subheadline: PROFILE.subheadline,
      summary: PROFILE.summary,
      location: PROFILE.location,
      email: PROFILE.email,
      phone: PROFILE.phone,
      whatsapp: PROFILE.whatsapp,
      linkedinUrl: PROFILE.linkedinUrl,
      githubUrl: PROFILE.githubUrl,
      facebookUrl: PROFILE.facebookUrl,
      messengerUsername: PROFILE.messengerUsername,
      avatarPath: null,
      websiteUrl: "https://gazimonir.example",
    },
    experiences: EXPERIENCES.map((experience) => ({
      slug: experience.slug,
      title: experience.title,
      company: experience.company,
      companyUrl: experience.companyUrl,
      employmentType: experience.employmentType,
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      isCurrent: experience.isCurrent,
      summary: experience.summary,
      bullets: experience.bullets,
      tags: experience.tags,
    })),
    educations: EDUCATIONS.map((education) => ({
      school: education.school,
      degree: education.degree,
      field: education.field,
      startYear: education.startYear,
      endYear: education.endYear,
      details: education.details,
    })),
    skills,
    certifications: CERTIFICATIONS.map((certification) => ({
      name: certification.name,
      issuer: certification.issuer,
      issuedOn: certification.issuedOn,
      url: certification.url,
    })),
    projects: PROJECTS.map((project) => ({
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      body: project.body,
      role: project.role,
      client: project.client,
      year: project.year,
      liveUrl: project.liveUrl,
      repoUrl: project.repoUrl,
      techStack: project.techStack,
      coverPath: null,
      featured: project.featured,
      images: [],
    })),
  };
}

/* ------------------------------------------------------------- helpers --- */

interface ExtractedPdf {
  bytes: Uint8Array;
  text: string;
  pageCount: number;
  info: Record<string, unknown>;
  imageOps: string[];
}

/**
 * Extract the text layer exactly as a parser would. Text items are joined with a
 * newline and then collapsed, so a line break is never mistaken for a missing
 * space (`October 2024` must survive as one string).
 */
async function extract(buffer: Buffer): Promise<ExtractedPdf> {
  const bytes = new Uint8Array(buffer);
  const doc = await getDocument({ data: bytes, useSystemFonts: true }).promise;

  const opNames = new Map<number, string>(Object.entries(OPS).map(([name, code]) => [code, name]));
  const imageOpCodes = new Set(
    Object.entries(OPS)
      .filter(([name]) => /image/i.test(name))
      .map(([, code]) => code),
  );

  let text = "";
  const imageOps: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      text += `${"str" in item ? item.str : " "}\n`;
    }

    const operators = await page.getOperatorList();
    for (const code of operators.fnArray) {
      if (imageOpCodes.has(code)) imageOps.push(opNames.get(code) ?? String(code));
    }
  }

  const metadata = await doc.getMetadata();

  return {
    bytes,
    text: text.replace(/\s+/g, " ").trim(),
    pageCount: doc.numPages,
    info: (metadata.info ?? {}) as Record<string, unknown>,
    imageOps,
  };
}

/* ---------------------------------------------------------------- tests --- */

let renderedPdf: ExtractedPdf | null = null;

/** Render once, then read the result from every test below. */
async function rendered(): Promise<ExtractedPdf> {
  if (!renderedPdf) {
    renderedPdf = await extract(await renderAtsCv(fixtureSource()));
  }
  return renderedPdf;
}

describe("ATS CV PDF", () => {
  it("renders without throwing", async () => {
    const buffer = await renderAtsCv(fixtureSource());
    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect((await rendered()).pageCount).toBeGreaterThanOrEqual(1);
  });

  it("extracts a substantial, real text layer", async () => {
    const pdf = await rendered();
    expect(pdf.text.length).toBeGreaterThan(1000);
    expect(pdf.text).toContain(PROFILE.fullName);
    expect(pdf.text).toContain(PROFILE.email);
  });

  it("is at least one page long", async () => {
    expect((await rendered()).pageCount).toBeGreaterThanOrEqual(1);
  });

  it("uses the conventional section headings, in the conventional order", async () => {
    const pdf = await rendered();
    // Walking a cursor forward asserts order, not just presence: an occurrence
    // of a heading earlier in the document cannot satisfy a later position.
    let cursor = 0;
    for (const heading of ATS_SECTION_ORDER) {
      const at = pdf.text.indexOf(heading, cursor);
      expect(at, `heading "${heading}" is missing or out of order`).toBeGreaterThanOrEqual(0);
      cursor = at + heading.length;
    }
  });

  it("prints every job title and company", async () => {
    const pdf = await rendered();
    for (const experience of EXPERIENCES) {
      expect(pdf.text, `title "${experience.title}"`).toContain(experience.title);
      expect(pdf.text, `company "${experience.company}"`).toContain(experience.company);
    }
  });

  it("formats dates as Month YYYY", async () => {
    const pdf = await rendered();

    // Every experience date range must be present verbatim and in the required
    // shape — "October 2024 to Present", never "10/2024" or "Oct 2024".
    const expectedMonthYears = new Set<string>();
    for (const experience of EXPERIENCES) {
      const range = formatDateRange(
        experience.startDate,
        experience.endDate,
        experience.isCurrent,
      );
      expect(range, `range for ${experience.company}`).toMatch(
        /^[A-Z][a-z]+ \d{4} to (?:[A-Z][a-z]+ \d{4}|Present)$/,
      );
      expect(pdf.text, `range for ${experience.company}`).toContain(range);

      expectedMonthYears.add(formatMonthYear(experience.startDate));
      if (!experience.isCurrent && experience.endDate) {
        expectedMonthYears.add(formatMonthYear(experience.endDate));
      }
    }

    expect(pdf.text).toContain(" to Present");

    // The only "Month YYYY" tokens in the document are the ones this fixture put
    // there: no abbreviated date slipped in from somewhere else in the renderer.
    const renderedDates = new Set<string>(
      pdf.text.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/g) ?? [],
    );
    expect([...renderedDates].sort()).toEqual([...expectedMonthYears].sort());

    // ...and no numeric or ISO date anywhere.
    expect(pdf.text).not.toMatch(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
    expect(pdf.text).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b/);
  });

  it("lists the education, skills and certifications content", async () => {
    const pdf = await rendered();
    for (const education of EDUCATIONS) {
      expect(pdf.text).toContain(education.school);
    }
    for (const group of fixtureSource().skills) {
      expect(pdf.text).toContain(`${group.category}:`);
    }
    for (const certification of CERTIFICATIONS) {
      expect(pdf.text).toContain(certification.name);
      expect(pdf.text).toContain(certification.issuer);
    }
  });

  it("sets the document title and author", async () => {
    const pdf = await rendered();
    expect(String(pdf.info.Title ?? "")).toContain(PROFILE.fullName);
    expect(String(pdf.info.Author ?? "")).toBe(PROFILE.fullName);
  });

  it("contains no images or image XObjects", async () => {
    const pdf = await rendered();
    expect(pdf.imageOps).toHaveLength(0);

    // The blunt instrument, and the one that matters: no image entry may exist
    // anywhere in the file, however it is referenced.
    const raw = Buffer.from(pdf.bytes).toString("latin1");
    expect(raw).not.toMatch(/\/Subtype\s*\/Image/);
    expect(raw).not.toContain("/Image");
  });
});
