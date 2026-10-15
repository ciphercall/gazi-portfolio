import { Briefcase, Home, LayoutGrid, Mail, type LucideIcon } from "lucide-react";

/**
 * The public navigation, shared by the header, the footer and the 404 page.
 *
 * Each item carries its own icon: every link is icon *plus* visible label, so
 * a row of controls never reads as a row of unlabelled glyphs.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** One-line explanation, shown in the footer. */
  blurb: string;
}

export const NAV_LINKS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: Home, blurb: "Intro, highlights and contact" },
  { href: "/projects", label: "Projects", icon: LayoutGrid, blurb: "Production systems shipped" },
  { href: "/experience", label: "Experience", icon: Briefcase, blurb: "Roles, timeline and stack" },
  { href: "/contact", label: "Contact", icon: Mail, blurb: "Every way to reach me" },
];

/** True when `pathname` sits inside `href`'s section (never for "/"). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
