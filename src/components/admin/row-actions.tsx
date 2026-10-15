"use client";

import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Trash2, X, type LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { ActionButton, type ActionVariant } from "@/components/admin/action-button";
import { runWithToast } from "@/components/admin/use-admin-submit";
import { reorderEntities } from "@/lib/admin/actions/reorder";
import type { ActionResult, ReorderModel } from "@/lib/admin/types";

/**
 * Controls that live inside a list row.
 *
 * Every one of them is labelled with words, never an icon standing alone — the
 * owner was explicit about that, and in a dense table it is also just easier to
 * scan "Move up" than to decode two chevrons.
 */

type ButtonSize = "sm" | "md";

export interface RunActionButtonProps<TInput, TData> {
  action: (input: TInput) => Promise<ActionResult<TData>>;
  input: TInput;
  icon: LucideIcon;
  label: string;
  variant?: ActionVariant;
  size?: ButtonSize;
  pendingLabel?: string;
  disabled?: boolean;
  /** When set, the button asks for confirmation using this label first. */
  confirmLabel?: string;
  successMessage?: string;
  onSuccess?: (data: TData | undefined) => void;
}

export function RunActionButton<TInput, TData>({
  action,
  input,
  icon: Icon,
  label,
  variant = "secondary",
  size = "md",
  pendingLabel = "Working…",
  disabled,
  confirmLabel,
  successMessage,
  onSuccess,
}: RunActionButtonProps<TInput, TData>) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = () => {
    startTransition(async () => {
      const result = await runWithToast(action, input, { successMessage });
      if (result.ok) {
        setConfirming(false);
        onSuccess?.(result.data);
      }
    });
  };

  if (confirming && confirmLabel) {
    return (
      <span className="inline-flex items-center gap-2">
        <ActionButton
          icon={Check}
          label={confirmLabel}
          variant="danger"
          size={size}
          pending={pending}
          pendingLabel={pendingLabel}
          onClick={run}
        />
        <ActionButton
          icon={X}
          label="Cancel"
          variant="ghost"
          size={size}
          disabled={pending}
          onClick={() => setConfirming(false)}
        />
      </span>
    );
  }

  return (
    <ActionButton
      icon={Icon}
      label={label}
      variant={variant}
      size={size}
      pending={pending}
      pendingLabel={pendingLabel}
      disabled={disabled}
      onClick={() => (confirmLabel ? setConfirming(true) : run())}
    />
  );
}

/** Publish / unpublish, driven by whichever server action the page passes in. */
export function PublishToggle({
  id,
  isPublished,
  action,
  size = "sm",
}: {
  id: string;
  isPublished: boolean;
  action: (input: {
    id: string;
    isPublished: boolean;
  }) => Promise<ActionResult<{ id: string; isPublished: boolean }>>;
  size?: ButtonSize;
}) {
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      await runWithToast(action, { id, isPublished: !isPublished }, { silentSuccess: false });
    });
  };

  return (
    <ActionButton
      icon={isPublished ? Eye : EyeOff}
      label={isPublished ? "Published" : "Draft"}
      title={isPublished ? "Click to unpublish" : "Click to publish"}
      variant={isPublished ? "success" : "ghost"}
      size={size}
      pending={pending}
      pendingLabel="Saving…"
      onClick={toggle}
    />
  );
}

/** Delete with an inline two-step confirm — no browser dialog, no accidental loss. */
export function DeleteEntityButton({
  id,
  action,
  entityLabel,
  size = "sm",
  onSuccess,
}: {
  id: string;
  action: (id: string) => Promise<ActionResult<{ id: string }>>;
  /** e.g. "experience" — becomes "Delete experience" / "Confirm delete". */
  entityLabel: string;
  size?: ButtonSize;
  onSuccess?: () => void;
}) {
  return (
    <RunActionButton
      action={action}
      input={id}
      icon={Trash2}
      label={`Delete ${entityLabel}`}
      confirmLabel="Confirm delete"
      variant="danger"
      size={size}
      pendingLabel="Deleting…"
      successMessage="Deleted."
      onSuccess={onSuccess}
    />
  );
}

/**
 * Up/down reordering.
 *
 * Sends the whole list in its new order to `reorderEntities`, which rewrites
 * `order` for every row in one transaction and revalidates the page.
 */
export function ReorderControls({
  model,
  ids,
  index,
  size = "sm",
}: {
  model: ReorderModel;
  ids: string[];
  index: number;
  size?: ButtonSize;
}) {
  const [pending, startTransition] = useTransition();

  const move = (direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;

    const next = [...ids];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) return;
    next.splice(target, 0, moved);

    startTransition(async () => {
      await runWithToast(reorderEntities, { model, ids: next }, { successMessage: "Order saved." });
    });
  };

  const atTop = index === 0;
  const atBottom = index === ids.length - 1;

  return (
    <div className="flex items-center gap-1.5">
      <ActionButton
        icon={ArrowUp}
        label="Move up"
        variant="ghost"
        size={size}
        disabled={atTop}
        pending={pending}
        pendingLabel="Saving…"
        onClick={() => move(-1)}
      />
      <ActionButton
        icon={ArrowDown}
        label="Move down"
        variant="ghost"
        size={size}
        disabled={atBottom}
        pending={pending}
        pendingLabel="Saving…"
        onClick={() => move(1)}
      />
    </div>
  );
}
