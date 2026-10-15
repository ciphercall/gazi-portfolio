import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperienceForm } from "@/components/admin/forms/experience-form";
import { requireAdmin } from "@/lib/auth";
import { getExperience, nextExperienceOrder } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

/**
 * `/admin/experiences/[id]` where `id` is a cuid or the literal `new`.
 *
 * The literal is handled before any query — `new` is not a cuid, and asking the
 * database for it would be a wasted round trip.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === "new" ? "New experience" : "Edit experience",
    robots: { index: false, follow: false },
  };
}

export default async function AdminExperienceEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  if (id === "new") {
    const suggestedOrder = await nextExperienceOrder();
    return <ExperienceForm initial={null} suggestedOrder={suggestedOrder} />;
  }

  const row = await getExperience(id);
  if (!row) notFound();

  return <ExperienceForm initial={row} suggestedOrder={row.order} />;
}
