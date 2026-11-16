import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppLinkForm } from "@/components/admin/forms/app-link-form";
import { requireAdmin } from "@/lib/auth";
import { getAppLink, nextAppLinkOrder } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === "new" ? "New app link" : "Edit app link",
    robots: { index: false, follow: false },
  };
}

export default async function AdminAppLinkEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  if (id === "new") {
    const suggestedOrder = await nextAppLinkOrder();
    return <AppLinkForm initial={null} suggestedOrder={suggestedOrder} />;
  }

  const row = await getAppLink(id);
  if (!row) notFound();

  return <AppLinkForm initial={row} suggestedOrder={row.order} />;
}
