import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ReorderModel } from "@/lib/admin/types";

/**
 * Order rewriting, shared by the server action the panel uses and by
 * `/api/admin/reorder` (kept for scripted/bulk use).
 *
 * The whole list is rewritten inside one transaction, so a partial failure can
 * never leave two rows claiming the same position.
 */

export interface ReorderResult {
  model: ReorderModel;
  updated: number;
}

export async function applyReorder(model: ReorderModel, ids: string[]): Promise<ReorderResult> {
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new Error("The reorder list contains duplicate ids.");
  }

  await prisma.$transaction(async (tx) => {
    // Refuse to apply a list that does not describe the table: a stale browser
    // tab sending yesterday's ids would otherwise silently scramble the order.
    const known = await countForModel(tx, model, ids);
    if (known !== ids.length) {
      throw new Error("That list is out of date — reload the page and drag again.");
    }

    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      if (!id) continue;
      await applyUpdate(tx, model, id, index);
    }
  });

  return { model, updated: ids.length };
}

type TransactionClient = Prisma.TransactionClient;

function countForModel(
  tx: TransactionClient,
  model: ReorderModel,
  ids: string[],
): Promise<number> {
  switch (model) {
    case "experience":
      return tx.experience.count({ where: { id: { in: ids } } });
    case "project":
      return tx.project.count({ where: { id: { in: ids } } });
    case "education":
      return tx.education.count({ where: { id: { in: ids } } });
    case "skill":
      return tx.skill.count({ where: { id: { in: ids } } });
    case "certification":
      return tx.certification.count({ where: { id: { in: ids } } });
  }
}

function applyUpdate(
  tx: TransactionClient,
  model: ReorderModel,
  id: string,
  order: number,
): Promise<unknown> {
  switch (model) {
    case "experience":
      return tx.experience.update({ where: { id }, data: { order } });
    case "project":
      return tx.project.update({ where: { id }, data: { order } });
    case "education":
      return tx.education.update({ where: { id }, data: { order } });
    case "skill":
      return tx.skill.update({ where: { id }, data: { order } });
    case "certification":
      return tx.certification.update({ where: { id }, data: { order } });
  }
}
