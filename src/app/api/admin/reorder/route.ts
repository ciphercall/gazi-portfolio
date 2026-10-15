import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { describeUnknownError } from "@/lib/admin/errors";
import { applyReorder } from "@/lib/admin/reorder";
import { reorderSchema } from "@/lib/admin/schemas";
import type { ReorderModel } from "@/lib/admin/types";

/**
 * Bulk reordering, for scripts and for the panel's own up/down controls.
 *
 * Body: { "model": "experience" | "project" | "education" | "skill" | "certification",
 *         "ids":   ["cuid", "cuid", ...] }
 *
 * `ids` is the *complete* list in its new order. The whole rewrite happens in one
 * transaction, so a page loaded from a stale tab is rejected rather than allowed
 * to scramble the ordering.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_PATHS: Record<ReorderModel, string> = {
  experience: "/admin/experiences",
  project: "/admin/projects",
  education: "/admin/education",
  skill: "/admin/skills",
  certification: "/admin/certifications",
};

export async function POST(request: Request): Promise<NextResponse> {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Admin session required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Expected a JSON body: { "model": "...", "ids": [...] }.' },
      { status: 400 },
    );
  }

  const parsed = reorderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "That reorder request was not valid.",
      },
      { status: 422 },
    );
  }

  const { model, ids } = parsed.data;

  try {
    const result = await applyReorder(model, ids);

    // Same choke point as every other mutation: the public site and both CV
    // variants are invalidated once, here.
    touchContent();
    revalidatePath(ADMIN_PATHS[model]);

    return NextResponse.json(
      { ok: true, message: "Order saved.", model: result.model, updated: result.updated },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = describeUnknownError(error, "The new order could not be saved.");
    const stale = message.includes("out of date");
    return NextResponse.json(
      { ok: false, message },
      { status: stale ? 409 : 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
