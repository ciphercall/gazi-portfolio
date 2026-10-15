import clsx from "clsx";
import {
  CircleAlert,
  CircleCheck,
  Clock,
  Info,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * Presentational primitives shared by the social panel.
 *
 * No "use client" here on purpose: these are pure, prop-driven and import
 * nothing server-only, so the same definitions serve the server-rendered page
 * and the interactive client components without drifting apart.
 *
 * Two owner rules are baked in rather than left to each call site:
 *   - Status is always icon + word + colour. Colour alone carries no meaning,
 *     so the chip is still readable in monochrome, in high contrast and to
 *     someone who cannot distinguish teal from rose.
 *   - Anything read-only is sunk and muted with no hover or tap affordance, so
 *     it never looks like a control.
 */

/* ------------------------------------------------------------------- status --- */

/**
 * The three outcomes the panel must never confuse, plus one honestly separate
 * state for a dispatch the provider actively rejected.
 *
 * `QUEUED` and `DRAFT` both mean "nothing is live yet", so they share the
 * "Ready to post" presentation. `FAILED` gets its own word ("Couldn't post")
 * rather than being folded into "Ready to post": a post that the provider
 * refused is not ready to post, and saying so is the difference between a
 * truthful panel and a reassuring one.
 */
export type DispatchStatusKey = "POSTED" | "QUEUED" | "DRAFT" | "FAILED" | "NEEDS_RECONNECT";

interface StatusPresentation {
  label: string;
  icon: LucideIcon;
  /** Text colour, border and tint. Never the only signal. */
  className: string;
}

const STATUS_PRESENTATION: Record<DispatchStatusKey, StatusPresentation> = {
  POSTED: {
    label: "Posted",
    icon: CircleCheck,
    className: "text-teal border-teal/45 bg-teal/12",
  },
  QUEUED: {
    label: "Ready to post",
    icon: Clock,
    className: "text-cyan border-cyan/45 bg-cyan/12",
  },
  DRAFT: {
    label: "Ready to post",
    icon: Clock,
    className: "text-cyan border-cyan/45 bg-cyan/12",
  },
  FAILED: {
    label: "Couldn't post",
    icon: CircleAlert,
    className: "text-rose border-rose/45 bg-rose/12",
  },
  NEEDS_RECONNECT: {
    label: "Needs reconnect",
    icon: Unplug,
    className: "text-violet border-violet/45 bg-violet/12",
  },
};

export function StatusChip({
  status,
  className,
}: {
  status: DispatchStatusKey;
  className?: string;
}) {
  const presentation = STATUS_PRESENTATION[status];
  const Icon = presentation.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        presentation.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {presentation.label}
    </span>
  );
}

/** Legend for the log — every state spelled out, so the chips need no guessing. */
export function StatusLegend() {
  const order: DispatchStatusKey[] = ["POSTED", "QUEUED", "FAILED", "NEEDS_RECONNECT"];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {order.map((status) => (
        <li key={status}>
          <StatusChip status={status} />
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------- chips --- */

export function ProviderChip({
  label,
  tone,
}: {
  label: string;
  tone: "linkedin" | "facebook";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        tone === "linkedin"
          ? "border-cyan/40 bg-cyan/10 text-cyan"
          : "border-violet/40 bg-violet/10 text-violet",
      )}
    >
      {label}
    </span>
  );
}

export function Note({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning";
  children: ReactNode;
}) {
  const Icon = tone === "warning" ? CircleAlert : Info;
  return (
    <div
      className={clsx(
        "flex gap-3 rounded-control border px-4 py-3 text-sm",
        tone === "warning"
          ? "border-rose/35 bg-rose/8 text-ink"
          : "border-line-strong bg-panel text-muted",
      )}
    >
      <Icon
        className={clsx("mt-0.5 h-4 w-4 shrink-0", tone === "warning" ? "text-rose" : "text-teal")}
        aria-hidden="true"
      />
      <div className="min-w-0 space-y-1">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------- values --- */

/**
 * A value the admin cannot edit: sunk surface, muted text, `select-all` so it
 * can still be copied, and no hover state or button semantics anywhere.
 */
export function ReadOnlyValue({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Screen-reader-only description, e.g. "Read-only value". */
  label?: string;
}) {
  return (
    <div
      className={clsx(
        "cursor-text select-all rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm break-words text-muted",
        className,
      )}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {children}
    </div>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="label-mono">{label}</span>
      <div className="mt-1">
        <ReadOnlyValue label={`${label} (read-only)`}>{value}</ReadOnlyValue>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- layout --- */

export function Panel({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("glass overflow-hidden", className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {description ? (
            <div className="mt-1 max-w-3xl text-sm text-muted">{description}</div>
          ) : null}
        </div>
        {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
      </header>
      {children}
    </section>
  );
}

/**
 * The sticky action bar.
 *
 * Rendered as a sibling of a panel's scroll region, never inside it, and pinned
 * with `sticky bottom-0`. That combination is what keeps a required action
 * reachable no matter how long the content above it gets — the action stays put
 * while the body scrolls away, and it does not scroll out of the panel.
 */
export function StickyActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-line bg-canvas-2/95 px-4 py-3 backdrop-blur sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ buttons --- */

/**
 * Every control in this panel carries an icon AND a visible word. There is no
 * icon-only variant to reach for, by design: a tooltip is not a label.
 */

export const buttonBaseClass =
  "inline-flex items-center gap-2 rounded-control border px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55";

export const buttonPrimaryClass = clsx(
  buttonBaseClass,
  "border-teal/50 bg-teal/15 text-ink hover:bg-teal/25",
);

export const buttonSecondaryClass = clsx(
  buttonBaseClass,
  "border-line-strong bg-panel text-ink hover:border-teal/50 hover:bg-teal/10",
);

export const buttonDangerClass = clsx(
  buttonBaseClass,
  "border-rose/45 bg-rose/10 text-ink hover:bg-rose/20",
);

/** A link that reads as a button. Real anchor, so it works without JavaScript. */
export function ActionLink({
  href,
  icon: Icon,
  children,
  variant = "secondary",
  external = false,
  className,
}: {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  external?: boolean;
  className?: string;
}) {
  const variantClass =
    variant === "primary"
      ? buttonPrimaryClass
      : variant === "danger"
        ? buttonDangerClass
        : buttonSecondaryClass;

  return (
    <a
      href={href}
      className={clsx(variantClass, "no-underline", className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
      {external ? <span className="sr-only">(opens in a new tab)</span> : null}
    </a>
  );
}
