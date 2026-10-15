"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/**
 * Light/dark switch.
 *
 * The label states the action ("Light mode") and the accessible name spells it
 * out, so the control is never a bare glyph.
 *
 * Mount detection uses `useSyncExternalStore` rather than a `setState` inside an
 * effect: the resolved theme only exists on the client, and setting state from
 * an effect on mount causes a cascading render. This returns false during SSR
 * and true on the client, which is exactly the question being asked, with no
 * effect and no hydration mismatch.
 */

const subscribeToNothing = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToNothing, onClient, onServer);

  const isDark = !mounted || resolvedTheme !== "light";
  const nextLabel = isDark ? "Light mode" : "Dark mode";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      className={`pill ${className}`}
      aria-label={`Switch to ${nextLabel.toLowerCase()}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{nextLabel}</span>
    </button>
  );
}
