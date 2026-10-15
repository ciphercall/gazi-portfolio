import { chromium, type Browser } from "playwright-core";

import { signRenderToken } from "@/lib/crypto";

/**
 * The designed CV, printed by a real browser.
 *
 * The document is a page of this same application, so it is laid out by the same
 * CSS engine a visitor sees — that is what makes the PDF pixel-identical to the
 * design instead of an approximation of it. Chromium drives it:
 *
 *   - the render route is fetched over HTTP from `127.0.0.1`, because inside the
 *     container the app is the only thing serving it and a `file://` load would
 *     not run the Next.js render at all;
 *   - the route is token gated with a short-lived HMAC, so the print surface is
 *     never publicly reachable;
 *   - the browser is closed in a `finally`, including on the failure paths — a
 *     leaked Chromium per failed regeneration would eat the container.
 *
 * Takes seconds, so callers only reach for it on a cache miss (or an explicit
 * admin "regenerate"), never on the happy path of a visitor request.
 */

export const DESIGNED_RENDER_ROUTE = "/render/cv/designed";

/** A4 in CSS pixels at 96dpi — the viewport Chromium lays the page out in. */
export const A4_VIEWPORT = { width: 794, height: 1123 } as const;

const DEFAULT_CHROMIUM = "/usr/bin/chromium-browser";

/**
 * Flags that make headless printing work inside a container:
 *   --no-sandbox            containers cannot create the required user namespaces
 *   --disable-dev-shm-usage /dev/shm is tiny in Docker; without this Chromium dies
 *                           on larger documents
 *   --disable-gpu           no GPU in the container, and probing for one is slow
 *   --font-render-hinting=none  identical glyph metrics on every host
 */
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

function internalOrigin(): string {
  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}`;
}

/** Absolute URL of the print surface, carrying a fresh render token. */
export function designedRenderUrl(options?: { ttlSeconds?: number }): string {
  const token = signRenderToken(options?.ttlSeconds ?? 300);
  return `${internalOrigin()}${DESIGNED_RENDER_ROUTE}?token=${encodeURIComponent(token)}`;
}

export interface DesignedRenderOptions {
  /** How long the render token stays valid. Defaults to five minutes. */
  ttlSeconds?: number;
  /** Overall budget for the whole print, in milliseconds. */
  timeoutMs?: number;
}

/** Print the designed CV to PDF bytes. The caller owns persistence. */
export async function renderDesignedCv(options?: DesignedRenderOptions): Promise<Buffer> {
  const timeoutMs = options?.timeoutMs ?? 45_000;

  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({
      executablePath: executablePath(),
      args: CHROMIUM_ARGS,
    });

    const page = await browser.newPage({
      viewport: { width: A4_VIEWPORT.width, height: A4_VIEWPORT.height },
    });
    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(timeoutMs);

    const response = await page.goto(designedRenderUrl({ ttlSeconds: options?.ttlSeconds }), {
      waitUntil: "load",
    });

    if (!response || !response.ok()) {
      throw new Error(
        `CV render surface returned ${response ? response.status() : "no response"} — ` +
          `is the app listening on ${internalOrigin()}?`,
      );
    }

    // The document is styled for print and uses only system fonts, so this is
    // belt and braces: it makes the layout engine commit to print metrics before
    // the PDF is written.
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Closing a browser that already died must not mask the real failure.
      }
    }
  }
}
