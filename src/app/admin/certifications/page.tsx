import type { Metadata } from "next";
import { Award } from "lucide-react";

import { CertificationsManager } from "@/components/admin/forms/certifications-manager";
import { AdminPageFrame, AdminPageHeader } from "@/components/admin/page-frame";
import { requireAdmin } from "@/lib/auth";
import { listCertifications } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certifications",
  robots: { index: false, follow: false },
};

export default async function AdminCertificationsPage() {
  await requireAdmin();

  const rows = await listCertifications();

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Content"
          title="Certifications"
          description={`${rows.length} entr${rows.length === 1 ? "y" : "ies"}. These print in the certifications block of both CV variants.`}
        />
      }
    >
      <CertificationsManager rows={rows} />
    </AdminPageFrame>
  );
}
