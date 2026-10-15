"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { describeUnknownError } from "@/lib/admin/errors";
import { applyReorder } from "@/lib/admin/reorder";
import { fail, reorderSchema, zodFail } from "@/lib/admin/schemas";
import type { ActionResult, ReorderModel } from "@/lib/admin/types";

/**
 * Reordering, used by the up/down controls on every list.
 *
 * The caller sends the *entire* list in its new order — not a delta — because
 * that is the only form that cannot half-apply: either the panel's list is the
 * new truth, or nothing changed.
 */

const ADMIN_PATHS: Record<ReorderModel, string> = {
  experience: "/admin/experiences",
  project: "/admin/projects",
  education: "/admin/education",
  skill: "/admin/skills",
  certification: "/admin/certifications",
};

export async function reorderEntities(input: {
  model: ReorderModel;
  ids: string[];
}): Promise<ActionResult<{ model: ReorderModel; updated: number }>> {
  await requireAdmin();

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error, "That reorder request was not valid.");

  const { model, ids } = parsed.data;

  try {
    const result = await applyReorder(model, ids);

    touchContent();
    revalidatePath(ADMIN_PATHS[model]);

    return {
      ok: true,
      message: "Order saved.",
      data: { model: result.model, updated: result.updated },
    };
  } catch (error) {
    return fail(describeUnknownError(error, "The new order could not be saved."));
  }
}
