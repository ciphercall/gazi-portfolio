"use client";

import { useEffect } from "react";

/**
 * Packs the designed CV's blocks into A4 sheets, in the browser, before print.
 *
 * The old layout guessed how much would fit ("five entries on page one") and
 * then rendered whatever remained onto the next sheet. A guess cannot know how
 * tall a paragraph of nine-point text really is, so sheets came out short with a
 * band of untouched space above the footer, and long entries could spill.
 *
 * Measuring removes the guess. Every block is rendered once at the real body
 * width, measured in the same engine Chromium will print with, and then moved
 * into sheets. A block is never split; a section heading never sits alone at the
 * bottom of a sheet; a section that continues overleaf gets a "… (continued)"
 * heading of its own. Leftover space is distributed between the blocks of an
 * underfilled sheet rather than dumped under the last one.
 *
 * When the last sheet is built, `data-cv-ready` is set on `<html>`. The PDF
 * renderer waits for that flag, so a pagination failure fails the render instead
 * of shipping a half-empty PDF.
 */

const SHEET_HEIGHT_MM = 296.6;
/** `.cv-body` padding: 7mm top + 2mm bottom. */
const BODY_PADDING_MM = 9;
const GAP_MIN_MM = 5;
const GAP_MAX_MM = 11;

/** Guards against React's development double-effect before the ready flag lands. */
let paginationStarted = false;

interface FlowBlock {
  node: HTMLElement;
  group: string;
  heading: boolean;
  height: number;
}

interface PagePlan {
  blocks: FlowBlock[];
  continuation: HTMLElement | null;
  available: number;
  used: number;
}

function measureScale(doc: HTMLElement): number {
  const probe = doc.ownerDocument.createElement("div");
  probe.style.cssText = "position:absolute;left:-10000mm;top:0;width:100mm;height:0";
  doc.ownerDocument.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width / 100;
}

function buildContinuationHeading(
  template: HTMLElement | undefined,
  title: string,
): HTMLElement | null {
  if (!template) return null;
  const clone = template.cloneNode(true) as HTMLElement;
  for (const attribute of [
    "data-cv-block",
    "data-cv-heading",
    "data-cv-keep",
    "data-cv-group",
    "data-cv-group-title",
  ]) {
    clone.removeAttribute(attribute);
  }
  clone.classList.add("cv-section-cont");
  const heading = clone.querySelector("h2");
  if (heading) heading.textContent = `${title} (continued)`;
  return clone;
}

async function paginate(): Promise<void> {
  const root = document.documentElement;
  if (paginationStarted || root.dataset.cvReady) return;
  paginationStarted = true;

  const doc = document.querySelector<HTMLElement>("[data-cv-doc]");
  const source = doc?.querySelector<HTMLElement>("[data-cv-source]");
  const sheets = doc?.querySelector<HTMLElement>("[data-cv-sheets]");
  const flowBody = source?.querySelector<HTMLElement>(".cv-flow-body");
  const band = source?.querySelector<HTMLElement>("[data-cv-band]");
  const runhead = source?.querySelector<HTMLElement>("[data-cv-runhead]");
  const footer = source?.querySelector<HTMLElement>("[data-cv-footer]");

  if (!doc || !source || !sheets || !flowBody || !band || !runhead || !footer) {
    throw new Error("CV print surface is missing its measurement scaffolding.");
  }

  await document.fonts.ready;
  await Promise.all(
    Array.from(document.images).map((image) =>
      image.decode ? image.decode().catch(() => undefined) : Promise.resolve(),
    ),
  );

  const mm = measureScale(doc);
  if (!Number.isFinite(mm) || mm <= 0) {
    throw new Error("Could not resolve the print scale (px per mm).");
  }

  const gapPx = GAP_MIN_MM * mm;
  const sheetPx = SHEET_HEIGHT_MM * mm;
  const bodyPaddingPx = BODY_PADDING_MM * mm;
  const footerPx = footer.getBoundingClientRect().height;
  const availableFirst = sheetPx - band.getBoundingClientRect().height - footerPx - bodyPaddingPx;
  const availableRest = sheetPx - runhead.getBoundingClientRect().height - footerPx - bodyPaddingPx;

  if (availableFirst <= 0 || availableRest <= 0) {
    throw new Error("A4 body height resolved to zero — the print stylesheet did not load.");
  }

  const blocks: FlowBlock[] = Array.from(
    flowBody.querySelectorAll<HTMLElement>(":scope > [data-cv-block]"),
  ).map((node) => ({
    node,
    group: node.dataset.cvGroup ?? "",
    heading: node.hasAttribute("data-cv-heading"),
    height: node.getBoundingClientRect().height,
  }));

  if (blocks.length === 0) {
    throw new Error("The designed CV rendered no content blocks.");
  }

  const headingTemplates = new Map<string, HTMLElement>();
  const headingTitles = new Map<string, string>();
  const headingHeights = new Map<string, number>();
  for (const block of blocks) {
    if (!block.heading || !block.group) continue;
    if (!headingTemplates.has(block.group)) {
      headingTemplates.set(block.group, block.node);
      headingHeights.set(block.group, block.height);
    }
    const title = block.node.dataset.cvGroupTitle;
    if (title) headingTitles.set(block.group, title);
  }

  const pages: PagePlan[] = [];
  const seenGroups = new Set<string>();
  let pageGroups = new Set<string>();
  let current: PagePlan = { blocks: [], continuation: null, available: availableFirst, used: 0 };

  const closePage = () => {
    pages.push(current);
    current = { blocks: [], continuation: null, available: availableRest, used: 0 };
    pageGroups = new Set<string>();
  };

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (!block) continue;

    /** Continuation heading height for a block that opens a group mid-page. */
    const continuationHeight = (candidate: FlowBlock): number => {
      const opensGroupMidPage =
        !candidate.heading &&
        candidate.group !== "" &&
        !pageGroups.has(candidate.group) &&
        seenGroups.has(candidate.group);
      return opensGroupMidPage ? (headingHeights.get(candidate.group) ?? 0) : 0;
    };

    /** Gap + optional continuation heading + the block itself. */
    const addCost = (candidate: FlowBlock, continuation: number): number => {
      const startsPage = current.blocks.length === 0;
      const leadingGap = startsPage && continuation === 0 ? 0 : gapPx;
      return leadingGap + continuation + candidate.height;
    };

    /**
     * Extra height that must *also* fit for a section heading to be safe at the
     * foot of a sheet. Tested, never charged — the following block pays for
     * itself when it is placed.
     */
    const keepWithNext = (candidate: FlowBlock): number => {
      if (!candidate.heading || current.blocks.length === 0) return 0;
      const next = blocks[index + 1];
      return next ? gapPx + next.height : 0;
    };

    let continuation = continuationHeight(block);
    let cost = addCost(block, continuation);

    if (
      current.blocks.length > 0 &&
      current.used + cost + keepWithNext(block) > current.available
    ) {
      closePage();
      continuation = continuationHeight(block);
      cost = addCost(block, continuation);
    }

    if (continuation > 0) {
      const title = headingTitles.get(block.group) ?? block.group;
      current.continuation = buildContinuationHeading(headingTemplates.get(block.group), title);
    }

    current.blocks.push(block);
    current.used += cost;
    if (block.group) {
      seenGroups.add(block.group);
      pageGroups.add(block.group);
    }
  }
  pages.push(current);

  sheets.replaceChildren();
  const total = pages.length;

  pages.forEach((plan, pageIndex) => {
    const page = document.createElement("article");
    page.className = "cv-page";
    const header = pageIndex === 0 ? band : runhead;
    page.appendChild(header.cloneNode(true));

    const body = document.createElement("div");
    body.className = "cv-body";
    if (plan.continuation) body.appendChild(plan.continuation);
    for (const block of plan.blocks) body.appendChild(block.node);

    const gaps = Math.max(plan.blocks.length - 1 + (plan.continuation ? 1 : 0), 0);
    const leftover = Math.max(plan.available - plan.used, 0);
    const extraGap = gaps > 0 ? Math.min(leftover / gaps, (GAP_MAX_MM - GAP_MIN_MM) * mm) : 0;
    body.style.setProperty("--cv-fill-gap", `${GAP_MIN_MM + extraGap / mm}mm`);
    page.appendChild(body);

    const foot = footer.cloneNode(true) as HTMLElement;
    const label = foot.querySelector<HTMLElement>("[data-cv-page-label]");
    if (label) label.textContent = `Page ${pageIndex + 1} / ${total}`;
    page.appendChild(foot);

    sheets.appendChild(page);
  });

  source.remove();
  root.dataset.cvReady = "1";
}

export function CvPaginator() {
  useEffect(() => {
    void paginate().catch((error: unknown) => {
      console.error("[cv] pagination failed:", error);
      document.documentElement.dataset.cvReady = "error";
    });
  }, []);

  return null;
}
