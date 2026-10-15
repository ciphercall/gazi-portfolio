import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { SkillsManager } from "@/components/admin/forms/skills-manager";
import { AdminPageFrame, AdminPageHeader } from "@/components/admin/page-frame";
import { requireAdmin } from "@/lib/auth";
import { listSkills } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills",
  robots: { index: false, follow: false },
};

export default async function AdminSkillsPage() {
  await requireAdmin();

  const rows = await listSkills();
  const categories = new Set(rows.map((row) => row.category));

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Content"
          icon={Sparkles}
          title="Skills"
          description={`${rows.length} skill${rows.length === 1 ? "" : "s"} across ${categories.size} categor${categories.size === 1 ? "y" : "ies"}. The CV groups them by category, in the order below.`}
        />
      }
    >
      <SkillsManager rows={rows} />
    </AdminPageFrame>
  );
}
