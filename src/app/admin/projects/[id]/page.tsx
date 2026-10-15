import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/admin/forms/project-form";
import { requireAdmin } from "@/lib/auth";
import { getProject, nextProjectOrder } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === "new" ? "New project" : "Edit project",
    robots: { index: false, follow: false },
  };
}

export default async function AdminProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  if (id === "new") {
    const suggestedOrder = await nextProjectOrder();
    return <ProjectForm initial={null} suggestedOrder={suggestedOrder} />;
  }

  const row = await getProject(id);
  if (!row) notFound();

  return <ProjectForm initial={row} suggestedOrder={row.order} />;
}
