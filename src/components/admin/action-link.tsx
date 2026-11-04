import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The panel's navigation button.
 *
 * Deliberately NOT a client component: admin pages are server components and a
 * server component may only pass serialisable props across the boundary, so an
 * `icon` component object handed to a `"use client"` module throws
 * ("Functions cannot be passed directly to Client Components"). Keeping the
 * link server-safe lets pages render it directly while client forms can import
 * it too — `action-button.tsx` re-exports it for that side.
 */

export type ActionVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

export const ACTION_VARIANTS: Record<ActionVariant, string> = {
  primary:
    "border border-transparent bg-teal text-on-accent hover:brightness-110 active:brightness-95",
  success:
    "border border-teal/40 bg-teal/10 text-teal hover:bg-teal/20 hover:border-teal/70",
  secondary:
    "border border-line-strong bg-panel text-ink hover:border-teal/60 hover:bg-teal/10",
  danger: "border border-rose/40 bg-rose/10 text-rose hover:bg-rose/20 hover:border-rose/70",
  ghost: "border border-transparent text-muted hover:text-ink hover:bg-panel",
};

export const ACTION_SIZES = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-3.5 py-2 text-sm",
} as const;

export interface ActionLinkProps extends Pick<ComponentProps<typeof Link>, "href" | "prefetch"> {
  label: ReactNode;
  icon: LucideIcon;
  variant?: ActionVariant;
  size?: keyof typeof ACTION_SIZES;
  className?: string;
  title?: string;
  target?: string;
  download?: boolean;
}

/** Same visual language as `ActionButton`, for navigation. */
export function ActionLink({
  label,
  icon: Icon,
  href,
  variant = "secondary",
  size = "md",
  className,
  title,
  target,
  prefetch,
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      title={title}
      target={target}
      prefetch={prefetch}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-control font-medium leading-none transition",
        ACTION_SIZES[size],
        ACTION_VARIANTS[variant],
        className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
