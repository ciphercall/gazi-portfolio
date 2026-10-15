import type { Metadata } from "next";

import { ProfileForm } from "@/components/admin/forms/profile-form";
import { requireAdmin } from "@/lib/auth";
import { getProfileRow } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/** `/admin/profile` — the singleton, created on first save if the seed has not run. */
export default async function AdminProfilePage() {
  await requireAdmin();
  const profile = await getProfileRow();

  return <ProfileForm initial={profile} />;
}
