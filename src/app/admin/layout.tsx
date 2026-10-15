import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminChrome } from "@/components/admin/AdminChrome";
import { getSession } from "@/lib/auth";

/**
 * Admin shell.
 *
 * The page-level `requireAdmin()` calls are the real security boundary (see
 * `middleware.ts` for why two layers exist). This layout only decides what
 * framing to draw, which is why it reads the session *without* redirecting: the
 * login screen is a child of this layout, and a redirect here would loop.
 *
 * `force-dynamic` is load-bearing twice over: the panel is session-dependent, and
 * it keeps `next build` from trying to prerender admin pages in an environment
 * with no database.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // Read directly rather than through `getEnv()`: the layout renders for the
  // login page too, and a missing DATABASE_URL must not blank the sign-in form.
  const siteName = process.env.SITE_NAME?.trim() || "Gazi Monir-Uz-Zaman";

  return (
    <AdminChrome siteName={siteName} viewer={session?.email ?? null}>
      {children}
    </AdminChrome>
  );
}
