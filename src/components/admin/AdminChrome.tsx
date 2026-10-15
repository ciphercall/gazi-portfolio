"use client";

import { clsx } from "clsx";
import {
  Award,
  Briefcase,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Share2,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Toaster, toast } from "sonner";

import { ActionButton, ActionLink } from "@/components/admin/action-button";

/**
 * The panel's shell: navigation, the account strip, sign-out and the toast host.
 *
 * Rendered for every `/admin/*` route except the login screen, which the shell
 * deliberately skips so the sign-in form is not framed as if it were already
 * inside an authenticated area.
 *
 * The layout is `h-dvh` + `overflow-hidden` with a single scrolling child, which
 * is what lets each page keep its Save button outside the scroll region.
 */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, description: "Counts and status" },
  { href: "/admin/profile", label: "Profile", icon: UserRound, description: "Identity and contacts" },
  { href: "/admin/experiences", label: "Experience", icon: Briefcase, description: "Roles and dates" },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban, description: "Case studies" },
  { href: "/admin/education", label: "Education", icon: GraduationCap, description: "Schools" },
  { href: "/admin/skills", label: "Skills", icon: Sparkles, description: "Grouped by category" },
  { href: "/admin/certifications", label: "Certifications", icon: Award, description: "Courses and badges" },
  { href: "/admin/settings", label: "Settings", icon: Settings, description: "SEO and integrations" },
  { href: "/admin/cv", label: "CV PDFs", icon: FileText, description: "Generate and preview" },
  { href: "/admin/social", label: "Social", icon: Share2, description: "Posting and connections" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminChrome({
  children,
  siteName,
  viewer,
}: {
  children: ReactNode;
  siteName: string;
  viewer: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  const isLogin = pathname === "/admin/login";

  // A drawer that stays open after navigating is a trap on a phone.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const signOut = () => {
    startSignOut(async () => {
      try {
        const response = await fetch("/api/admin/logout", { method: "POST" });
        if (!response.ok && response.status !== 401) {
          toast.error("The sign-out request failed — closing the panel anyway.");
        } else {
          toast.success("Signed out.");
        }
      } catch {
        toast.error("Could not reach the server to sign out.");
      } finally {
        router.replace("/admin/login");
        router.refresh();
      }
    });
  };

  if (isLogin) {
    return (
      <>
        {children}
        <Toaster theme="dark" position="top-center" richColors closeButton />
      </>
    );
  }

  const current = NAV.find((item) => isActive(pathname, item.href));

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-canvas-2/40 lg:flex">
        <SidebarContent pathname={pathname} siteName={siteName} viewer={viewer} onSignOut={signOut} signingOut={signingOut} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/60 lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-canvas-2 lg:hidden">
            <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <span className="label-mono">Navigation</span>
              <ActionButton
                icon={X}
                label="Close"
                variant="ghost"
                size="sm"
                onClick={() => setDrawerOpen(false)}
              />
            </div>
            <SidebarContent
              pathname={pathname}
              siteName={siteName}
              viewer={viewer}
              onSignOut={signOut}
              signingOut={signingOut}
              hideBrand
            />
          </aside>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-canvas/85 px-4 py-2.5 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <ActionButton
              icon={Menu}
              label="Menu"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
            />
            <div className="min-w-0">
              <p className="label-mono truncate">Admin panel</p>
              <p className="truncate text-sm font-medium text-ink">
                {current?.label ?? "Admin"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionLink icon={ExternalLink} label="View site" href="/" target="_blank" size="sm" variant="ghost" />
            <ActionButton
              icon={LogOut}
              label="Sign out"
              size="sm"
              variant="secondary"
              pending={signingOut}
              pendingLabel="Signing out…"
              onClick={signOut}
            />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>

      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}

function SidebarContent({
  pathname,
  siteName,
  viewer,
  onSignOut,
  signingOut,
  hideBrand = false,
}: {
  pathname: string;
  siteName: string;
  viewer: string | null;
  onSignOut: () => void;
  signingOut: boolean;
  hideBrand?: boolean;
}) {
  return (
    <>
      {hideBrand ? null : (
        <div className="border-b border-line px-4 py-4">
          <Link href="/admin" className="block">
            <p className="label-mono">Portfolio</p>
            <p className="truncate text-sm font-semibold text-ink">{siteName}</p>
          </Link>
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto p-2.5">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-control border px-3 py-2 text-sm transition",
                    active
                      ? "border-teal/40 bg-teal/10 text-ink"
                      : "border-transparent text-muted hover:border-line hover:bg-panel hover:text-ink",
                  )}
                >
                  <Icon aria-hidden className={clsx("size-4 shrink-0", active ? "text-teal" : "text-faint")} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium leading-tight">{item.label}</span>
                    <span className="truncate text-[11px] leading-tight text-faint">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-3 py-3">
        <p className="label-mono">Signed in</p>
        <p className="truncate text-xs text-muted">{viewer ?? "admin"}</p>
        <ActionButton
          icon={LogOut}
          label="Sign out"
          variant="ghost"
          size="sm"
          className="mt-2"
          pending={signingOut}
          pendingLabel="Signing out…"
          onClick={onSignOut}
        />
      </div>
    </>
  );
}
