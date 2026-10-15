"use client";

import { clsx } from "clsx";
import { Loader2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The panel's one button.
 *
 * Two rules are baked into the API rather than left to discipline:
 *   - `label` is required and rendered next to the icon, so an icon-only button
 *     is not expressible (the owner asked for this explicitly).
 *   - `pending` swaps the icon for a spinner and disables the control, so a slow
 *     mutation cannot be double-submitted.
 */

export type ActionVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

const VARIANTS: Record<ActionVariant, string> = {
  primary:
    "border border-transparent bg-teal text-on-accent hover:brightness-110 active:brightness-95",
  success:
    "border border-teal/40 bg-teal/10 text-teal hover:bg-teal/20 hover:border-teal/70",
  secondary:
    "border border-line-strong bg-panel text-ink hover:border-teal/60 hover:bg-teal/10",
  danger: "border border-rose/40 bg-rose/10 text-rose hover:bg-rose/20 hover:border-rose/70",
  ghost: "border border-transparent text-muted hover:text-ink hover:bg-panel",
};

const SIZES = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-3.5 py-2 text-sm",
} as const;

export interface ActionButtonProps {
  /** Always rendered. There is no icon-only mode. */
  label: ReactNode;
  icon: LucideIcon;
  variant?: ActionVariant;
  size?: keyof typeof SIZES;
  pending?: boolean;
  /** Replaces the label while `pending` — e.g. "Saving…". */
  pendingLabel?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  title?: string;
  onClick?: () => void;
}

export function ActionButton({
  label,
  icon: Icon,
  variant = "secondary",
  size = "md",
  pending = false,
  pendingLabel,
  disabled = false,
  type = "button",
  className,
  title,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-control font-medium leading-none transition",
        "disabled:cursor-not-allowed disabled:opacity-55",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
    >
      {pending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        <Icon aria-hidden className="size-4" />
      )}
      <span className="whitespace-nowrap">{pending && pendingLabel ? pendingLabel : label}</span>
    </button>
  );
}

export interface ActionLinkProps extends Pick<ComponentProps<typeof Link>, "href" | "prefetch"> {
  label: ReactNode;
  icon: LucideIcon;
  variant?: ActionVariant;
  size?: keyof typeof SIZES;
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
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
