"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark switch.
 *
 * The label states the action ("Light mode") and the accessible name spells it
 * out, so the control is never a bare glyph. Rendering waits for mount because
 * the resolved theme only exists on the client — the placeholder keeps the same
 * size so the header does not shift.
 */

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
