"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Class-based theming: `.light` on <html> flips the semantic variables defined
 * in globals.css. Dark is the default — the site is designed dark-first.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="gazi-theme"
      value={{ dark: "dark", light: "light" }}
    >
      {children}
    </NextThemesProvider>
  );
}
