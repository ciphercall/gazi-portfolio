import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginFooterLink, LoginForm } from "@/components/admin/login-form";
import { getSession } from "@/lib/auth";
import { safeNextPath } from "@/lib/admin/login";

/**
 * `/admin/login`
 *
 * The one admin page that must NOT call `requireAdmin()` — it is the destination
 * that helper redirects to, so requiring a session here would be an infinite
 * loop. It uses `getSession()` instead: signed-in visitors are sent on to the
 * panel, everyone else sees the form.
 *
 * `?next=` is sanitised with `safeNextPath()`, which only accepts local `/admin`
 * paths, so the login form cannot be used as an open redirect.
 */

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = safeNextPath(rawNext);

  const session = await getSession();
  if (session) redirect(nextPath);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="aurora-mesh" aria-hidden />
      <div className="grid-overlay" aria-hidden />

      <div className="glass hairline relative z-10 w-full max-w-md p-7 sm:p-8">
        <p className="label-mono">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          <span className="text-aurora">Sign in to the panel</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Editing the portfolio, its projects and the CV downloads. Public pages stay read-only.
        </p>

        <div className="mt-6">
          <LoginForm nextPath={nextPath} />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          <LoginFooterLink />
          <span className="label-mono">Session · 7 days</span>
        </div>
      </div>
    </main>
  );
}
