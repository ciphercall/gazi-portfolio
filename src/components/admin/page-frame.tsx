import { clsx } from "clsx";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Page chrome for the panel.
 *
 * The frame is a fixed-height flex column: the header and the action bar are
 * outside the scroll container, so a 40-field form can scroll for a mile and
 * Save never leaves the viewport. That is why this is a component instead of a
 * class on each page — the layout is a rule, not a suggestion.
 */

export function AdminPageFrame({
  header,
  footer,
  children,
  className,
}: {
  header?: ReactNode;
  /** Rendered outside the scrolling region. Give it the Save button. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex h-full min-h-0 flex-col", className)}>
      {header}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">{children}</div>
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-line bg-canvas-2/80 backdrop-blur supports-[backdrop-filter]:bg-canvas-2/65">
          <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  icon: Icon,
  title,
  description,
  back,
  actions,
}: {
  eyebrow?: ReactNode;
  /** A glyph beside the title. Paired with the text, never a substitute for it. */
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-line bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition hover:text-teal"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            {back.label}
          </Link>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="label-mono">{eyebrow}</p> : null}
            <div className="flex items-center gap-2.5">
              {Icon ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-control border border-line bg-panel text-teal">
                  <Icon aria-hidden className="size-4" />
                </span>
              ) : null}
              <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            </div>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
            ) : null}
          </div>

          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}

/** The sticky bar. Always outside the scroll container — see `AdminPageFrame`. */
export function AdminActionBar({
  children,
  note,
}: {
  children: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {note ? <div className="text-xs text-faint">{note}</div> : null}
    </div>
  );
}

export function AdminSection({
  title,
  description,
  icon: Icon,
  actions,
  children,
  tone = "panel",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  tone?: "panel" | "sunk";
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-card border border-line",
        tone === "panel" ? "bg-panel" : "bg-canvas-2/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            {Icon ? <Icon aria-hidden className="size-4 text-teal" /> : null}
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-faint">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-canvas-2/30 px-6 py-10 text-center">
      <Icon aria-hidden className="size-6 text-faint" />
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Dense two/three column grid used by every editor form. */
export function FieldGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A full-width cell inside a two-column `FieldGrid`. */
export function FieldRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("md:col-span-2", className)}>{children}</div>;
}
