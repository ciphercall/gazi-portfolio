import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";

import { ThemeProvider } from "@/components/ThemeProvider";

import "./globals.css";

/**
 * Fonts are self-hosted by next/font at build time — no render-blocking request
 * to Google, no layout shift. The three variables are consumed by the
 * `@theme inline` block in globals.css.
 */
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-ui",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:8023"),
  title: {
    default: "Gazi Monir-Uz-Zaman — Senior Laravel & React Full-Stack Developer",
    template: "%s · Gazi Monir-Uz-Zaman",
  },
  description:
    "Portfolio of Gazi Monir-Uz-Zaman, senior full-stack developer: Laravel, React, Flutter and Node.js.",
  applicationName: "Gazi Monir-Uz-Zaman",
  authors: [{ name: "Gazi Monir-Uz-Zaman", url: "https://github.com/ciphercall" }],
  creator: "Gazi Monir-Uz-Zaman",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Gazi Monir-Uz-Zaman",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060910" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="grain min-h-dvh bg-canvas text-ink antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
