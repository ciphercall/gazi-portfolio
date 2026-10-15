import Link from "next/link";
import type { ReactNode } from "react";

import { AURORA_SWEEP } from "@/components/ui/aurora";

/**
 * The site's button/link primitive.
 *
 * `icon` is a required prop and `children` is the visible label: a control
 * without both is impossible to build with this component. That is deliberate —
 * the owner's rule is that no action may be icon-only.
 */

export type ActionVariant = "primary" | "ghost" | "quiet";

const BASE =
  "group inline-flex items-center gap-2 rounded-full text-sm font-medium transition duration-300 ease-aurora";

const VARIANTS: Record<ActionVariant, string> = {
  primary:
    "px-5 py-2.5 text-on-accent shadow-glow hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
  ghost: "pill",
  quiet:
    "px-1 py-0.5 text-muted underline-offset-4 hover:text-ink hover:underline decoration-line-strong",
};

export interface ActionLinkProps {
  href: string;
  /** Visible label. */
  children: ReactNode;
  /** Decorative glyph — paired with the label, never a replacement for it. */
  icon: ReactNode;
  variant?: ActionVariant;
  /** External (http/mailto/tel) links open in a new tab with a safe rel. */
  external?: boolean;
  className?: string;
  download?: boolean;
}

export function ActionLink({
  href,
  children,
  icon,
  variant = "ghost",
  external = false,
  className = "",
  download = false,
}: ActionLinkProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;
  const style = variant === "primary" ? { backgroundImage: AURORA_SWEEP } : undefined;
  const glyph = (
    <span className="shrink-0" aria-hidden="true">
      {icon}
    </span>
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        style={style}
        target="_blank"
        rel="noopener noreferrer"
        {...(download ? { download: true } : {})}
      >
        {glyph}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} style={style}>
      {glyph}
      <span>{children}</span>
    </Link>
  );
}
