"use client";

import { clsx } from "clsx";
import { Asterisk } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Form controls.
 *
 * Every input is a controlled component with an explicit `error` slot, so a
 * validation failure returned by a server action can be rendered exactly where
 * the owner has to fix it — not only in a toast that disappears.
 *
 * `ReadOnlyField` is deliberately not an `<input readOnly>`: it renders a sunk
 * surface with muted text and no border/hover affordance, so it cannot be
 * mistaken for something editable.
 */

const CONTROL =
  "w-full rounded-control border bg-canvas-2/50 px-3 py-2 text-sm text-ink transition " +
  "placeholder:text-faint disabled:cursor-not-allowed disabled:opacity-60";

function controlClass(error?: string): string {
  return clsx(
    CONTROL,
    error ? "border-rose/70 focus:border-rose" : "border-line focus:border-teal",
  );
}

export interface FieldShellProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Rendered to the right of the label — counters, badges, generate buttons. */
  accessory?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  required,
  accessory,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium text-muted">
          {label}
          {required ? <Asterisk aria-label="required" className="size-3 text-teal" /> : null}
        </label>
        {accessory}
      </div>
      {children}
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<FieldShellProps, "children"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel" | "password" | "date" | "number";
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "text" | "email" | "url" | "tel" | "numeric" | "decimal" | "search";
  mono?: boolean;
  onBlur?: () => void;
  size?: "sm" | "md";
}

export function TextField({
  label,
  htmlFor,
  hint,
  error,
  required,
  accessory,
  className,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  autoComplete,
  inputMode,
  mono,
  onBlur,
  size = "md",
}: TextFieldProps) {
  const id = htmlFor ?? `field-${typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : "input"}`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      accessory={accessory}
      className={className}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        spellCheck={false}
        className={clsx(
          controlClass(error),
          mono && "font-mono text-xs",
          size === "sm" && "px-2.5 py-1.5 text-xs",
        )}
      />
    </FieldShell>
  );
}

export interface TextAreaFieldProps extends Omit<FieldShellProps, "children"> {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  mono?: boolean;
}

export function TextAreaField({
  label,
  htmlFor,
  hint,
  error,
  required,
  accessory,
  className,
  value,
  onChange,
  rows = 5,
  placeholder,
  maxLength,
  mono,
}: TextAreaFieldProps) {
  const id = htmlFor ?? `field-${typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : "textarea"}`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      accessory={accessory}
      className={className}
    >
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck={!mono}
        className={clsx(controlClass(error), "resize-y leading-relaxed", mono && "font-mono text-xs")}
      />
    </FieldShell>
  );
}

export interface NumberFieldProps extends Omit<FieldShellProps, "children"> {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  /** Leave empty instead of writing null when the box is cleared. */
  emptyValue?: number | null;
}

export function NumberField({
  label,
  htmlFor,
  hint,
  error,
  required,
  accessory,
  className,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  emptyValue = null,
}: NumberFieldProps) {
  const id = htmlFor ?? `field-${typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : "number"}`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      accessory={accessory}
      className={className}
    >
      <input
        id={id}
        type="number"
        value={value === null ? "" : String(value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        inputMode="numeric"
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") {
            onChange(emptyValue);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : emptyValue);
        }}
        className={clsx(controlClass(error), "tabular-nums")}
      />
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<FieldShellProps, "children"> {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
}

export function SelectField({
  label,
  htmlFor,
  hint,
  error,
  required,
  accessory,
  className,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  const id = htmlFor ?? `field-${typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : "select"}`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      accessory={accessory}
      className={className}
    >
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(controlClass(error), "appearance-none bg-canvas-2/80")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export interface ToggleFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

/** A real checkbox under the hood — keyboard and screen-reader behaviour for free. */
export function ToggleField({
  label,
  hint,
  checked,
  onChange,
  disabled,
  onLabel = "On",
  offLabel = "Off",
  className,
}: ToggleFieldProps) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-start gap-3 rounded-control border border-line bg-canvas-2/40 px-3 py-2.5 transition hover:border-line-strong",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-teal"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2 text-sm text-ink">
          {label}
          <span
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
              checked ? "border-teal/50 text-teal" : "border-line text-faint",
            )}
          >
            {checked ? onLabel : offLabel}
          </span>
        </span>
        {hint ? <span className="text-xs text-faint">{hint}</span> : null}
      </span>
    </label>
  );
}

/**
 * A value the panel is reporting, not offering to edit: sunk surface, muted
 * text, no focus ring, no hover.
 */
export function ReadOnlyField({
  label,
  value,
  hint,
  mono,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <span className="flex items-center gap-1 text-xs font-medium text-muted">{label}</span>
      <div
        className={clsx(
          "select-all rounded-control border border-dashed border-line bg-canvas-2/25 px-3 py-2 text-sm text-muted",
          mono && "break-all font-mono text-xs",
        )}
      >
        {value === null || value === undefined || value === "" ? (
          <span className="text-faint">— not set —</span>
        ) : (
          value
        )}
      </div>
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

/** Small coloured status chip used by the dashboard and the asset panel. */
export function StatusChip({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "off";
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        tone === "ok" && "border-teal/50 bg-teal/10 text-teal",
        tone === "warn" && "border-rose/50 bg-rose/10 text-rose",
        tone === "off" && "border-line bg-canvas-2/40 text-faint",
      )}
    >
      {children}
    </span>
  );
}
