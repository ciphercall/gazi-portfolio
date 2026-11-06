import { chromium, type Browser } from "playwright-core";

import { contentHash, signRenderToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { buildMediaRelativePath, storeMediaFile } from "@/lib/media/storage";
import { getEnv } from "@/lib/env";

/**
 * The LinkedIn card: a 1200x627 PNG rendered by the browser already baked into
 * the image (the same Chromium that prints the CV).
 *
 * Why a rendered page rather than a sharp composite: the card has to look like
 * the site, and the site is CSS. Laying it out in the same engine is what makes
 * the image and the page agree — a sharp pipeline would be a second, drifting
 * implementation of the design.
 *
 * URL origin matters here. Inside the `app` container `127.0.0.1:3000` is the
 * Next server; inside the `scheduler` container it is not, so compose sets
 * SOCIAL_RENDER_ORIGIN=http://app:3000 for that service.
 */

export const CARD_VIEWPORT = { width: 1200, height: 627 } as const;

const DEFAULT_CHROMIUM = "/usr/bin/chromium-browser";

const CHROMIUM_ARGS = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
];

function executablePath(): string {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_CHROMIUM;
}

function renderOrigin(): string {
  const configured = process.env.SOCIAL_RENDER_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}`;
}

/** Hash of exactly the fields the card shows, so unrelated edits do not re-render. */
export function cardHash(project: {
  slug: string;
  title: string;
  summary: string;
  client: string | null;
  role: string | null;
  techStack: string[];
  coverPath: string | null;
}): string {
  return contentHash({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    client: project.client,
    role: project.role,
    techStack: project.techStack,
    coverPath: project.coverPath,
  });
}

/** Screenshot the token-gated card page and write it to the media volume. */
export async function renderCardPng(slug: string): Promise<string> {
  const token = signRenderToken(300);
  const url = `${renderOrigin()}/render/social/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`;

  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ executablePath: executablePath(), args: CHROMIUM_ARGS });
    const page = await browser.newPage({
      viewport: { width: CARD_VIEWPORT.width, height: CARD_VIEWPORT.height },
      deviceScaleFactor: 2,
    });
    page.setDefaultNavigationTimeout(30_000);
    page.setDefaultTimeout(30_000);

    const response = await page.goto(url, { waitUntil: "load" });
    if (!response || !response.ok()) {
      throw new Error(
        `Card render surface returned ${response ? response.status() : "no response"} — is ${renderOrigin()} reachable?`,
      );
    }

    await page.evaluate(async () => {
      await document.fonts.ready;
      // Images are inlined as data URLs, so this resolves without network access.
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.complete ? Promise.resolve() : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
        ),
      );
    });

    const png = await page.screenshot({ type: "png", fullPage: false });
    const { relativePath } = buildMediaRelativePath("social", "png");
    const stored = await storeMediaFile(relativePath, png);
    return stored.url;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // A browser that already died must not mask the real failure.
      }
    }
  }
}

/**
 * Make sure one dispatch has a card that matches its project.
 *
 * Returns the existing path when the content hash is unchanged, and re-renders
 * otherwise. Never throws: a card is an enhancement, and a failed render must not
 * stop a post from being published (the adapter falls back to text-only).
 */
export async function ensureCardForDispatch(dispatchId: string): Promise<string | null> {
  const dispatch = await prisma.socialDispatch.findUnique({
    where: { id: dispatchId },
    select: {
      id: true,
      imagePath: true,
      imageHash: true,
      project: {
        select: {
          slug: true,
          title: true,
          summary: true,
          client: true,
          role: true,
          techStack: true,
          coverPath: true,
        },
      },
    },
  });

  if (!dispatch?.project) return null;

  const hash = cardHash(dispatch.project);
  if (dispatch.imagePath && dispatch.imageHash === hash) return dispatch.imagePath;

  try {
    const url = await renderCardPng(dispatch.project.slug);
    await prisma.socialDispatch.update({
      where: { id: dispatch.id },
      data: { imagePath: url, imageHash: hash },
    });
    return url;
  } catch (error) {
    console.error(
      `[social] card render failed for dispatch ${dispatchId}:`,
      error instanceof Error ? error.message : "unknown error",
    );
    return dispatch.imagePath ?? null;
  }
}

/** Public origin, for the scheduler's log lines. */
export function siteOrigin(): string {
  return getEnv().SITE_URL.replace(/\/+$/, "");
}
