import { revalidatePath } from "next/cache";
import { after } from "next/server";

/**
 * The single choke point every admin mutation calls.
 *
 * Keeping it in one place is deliberate: a mutation that forgets to invalidate
 * leaves the site showing stale content, and that failure is invisible until
 * someone notices a wrong page. Agents call `touchContent()` and get both
 * behaviours; nothing else should call `revalidatePath` or `after` directly.
 */

/** Discard the client-side router cache so a visitor sees the edit immediately. */
export function revalidatePublic(): void {
  try {
    revalidatePath("/", "layout");
  } catch {
    // Called outside a request scope (e.g. from a script). Nothing to invalidate.
  }
}

/**
 * Regenerate both CV PDFs AFTER the response has been flushed.
 *
 * Printing HTML through Chromium takes seconds; making an admin wait for it in
 * the save request would be the wrong trade. If it fails, the cached asset is
 * left in place and the failure is logged — the next save retries, and the
 * download route falls back to an inline regeneration.
 */
export function enqueueCvRegen(): void {
  try {
    after(async () => {
      try {
        const { regenerateAllCvAssets } = await import("@/lib/pdf/assets");
        await regenerateAllCvAssets();
      } catch (error) {
        console.error("[cv] background regeneration failed:", error);
      }
    });
  } catch (error) {
    console.error("[cv] could not schedule regeneration:", error);
  }
}

/** Convenience: the pair of side effects a content mutation needs. */
export function touchContent(): void {
  revalidatePublic();
  enqueueCvRegen();
}
