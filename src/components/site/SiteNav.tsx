"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mail, Menu, X } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { AURORA_SWEEP } from "@/components/ui/aurora";
import { NAV_LINKS, isActivePath } from "@/components/site/nav-links";
import { ThemeToggle } from "@/components/site/ThemeToggle";

/**
 * Sticky site header.
 *
 * Sticky on purpose: the primary call to action ("Hire me") must stay reachable
 * no matter how long a page is — a request the owner made explicitly. The mobile
 * panel closes on navigation and on Escape, and its motion is skipped entirely
 * when the visitor prefers reduced motion.
 */

const EASE_AURORA: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface SiteNavProps {
  fullName: string;
  tagline: string;
}

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1] ?? "") : "";
  const letters = `${first.charAt(0)}${last ? last.charAt(0) : (first.charAt(1) ?? "")}`;
  return letters.toUpperCase() || "·";
}

export function SiteNav({ fullName, tagline }: SiteNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  // Keyed to the route the menu was opened on, so navigating closes it without
  // an effect. An effect here would call setState on every pathname change and
  // cause a cascading render for a value that is purely derived from the route.
  const [openOnRoute, setOpenOnRoute] = useState<string | null>(null);
  const open = openOnRoute === pathname;
  const setOpen = (next: boolean) => setOpenOnRoute(next ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Calls the raw setter directly: `setOpen` is re-created each render, so
      // referencing it here would make this effect depend on every render while
      // adding nothing, since closing is unconditional.
      if (event.key === "Escape") setOpenOnRoute(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="no-print sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="glass hairline flex items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-3.5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-control p-1 transition hover:bg-panel"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control font-display text-sm font-semibold text-on-accent"
              style={{ backgroundImage: AURORA_SWEEP }}
            >
              {initialsOf(fullName)}
            </span>
            <span className="min-w-0 max-w-[42vw] sm:max-w-none">
              <span className="block truncate text-sm font-semibold leading-tight text-ink">
                {fullName}
              </span>
              <span className="label-mono block truncate">{tagline}</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="ml-auto hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition duration-300 ease-aurora ${
                    active
                      ? "bg-panel font-medium text-ink"
                      : "text-muted hover:bg-panel hover:text-ink"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-teal" : "text-faint"}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 lg:ml-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <ActionLink
              href="/contact"
              variant="primary"
              icon={<Mail className="h-4 w-4" />}
              className="hidden lg:inline-flex"
            >
              Hire me
            </ActionLink>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls={open ? "site-menu" : undefined}
              className="pill lg:hidden"
            >
              {open ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="site-menu"
              id="site-menu"
              initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: EASE_AURORA }}
              className="glass-strong mt-2 p-3 lg:hidden"
            >
              <nav aria-label="Sections" className="grid gap-1">
                {NAV_LINKS.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-control px-3 py-2.5 transition ${
                        active ? "bg-panel text-ink" : "text-muted hover:bg-panel hover:text-ink"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-teal" : "text-faint"}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-xs text-faint">{item.blurb}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <ActionLink
                  href="/contact"
                  variant="primary"
                  icon={<Mail className="h-4 w-4" />}
                >
                  Hire me
                </ActionLink>
                <ThemeToggle className="sm:hidden" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
