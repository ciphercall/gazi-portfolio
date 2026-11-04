"use client";

import { clsx } from "clsx";
import { Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  ACTION_SIZES as SIZES,
  ACTION_VARIANTS as VARIANTS,
  type ActionVariant,
} from "@/components/admin/action-link";

/**
 * The panel's one button.
 *
 * Two rules are baked into the API rather than left to discipline:
 *   - `label` is required and rendered next to the icon, so an icon-only button
 *     is not expressible (the owner asked for this explicitly).
 *   - `pending` swaps the icon for a spinner and disables the control, so a slow
 *     mutation cannot be double-submitted.
 *
 * `ActionLink` lives in `action-link.tsx` (no "use client") and is re-exported
 * here so existing client imports keep working; server pages import it from
 * there directly, because an icon component cannot cross the RSC boundary.
 */

export { ActionLink } from "@/components/admin/action-link";
export type { ActionLinkProps, ActionVariant } from "@/components/admin/action-link";

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
