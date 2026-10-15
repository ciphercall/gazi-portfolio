import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import { EducationManager } from "@/components/admin/forms/education-manager";
import { AdminPageFrame, AdminPageHeader } from "@/components/admin/page-frame";
import { requireAdmin } from "@/lib/auth";
import { listEducations } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Education",
  robots: { index: false, follow: false },
};

export default async function AdminEducationPage() {
  await requireAdmin();

  const rows = await listEducations();

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Content"
          icon={GraduationCap}
          title="Education"
          description="Everything here is printed in the education block of both CV variants and grouped on the public page."
        />
      }
    >
      <EducationManager rows={rows} currentYear={new Date().getUTCFullYear()} />
    </AdminPageFrame>
  );
}
