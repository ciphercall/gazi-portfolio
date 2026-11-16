export type SeedAppPlatform = "WEB" | "ANDROID";

export interface SeedAppLink {
  slug: string;
  name: string;
  tagline: string;
  href: string;
  platform: SeedAppPlatform;
}

export const APP_LINKS: SeedAppLink[] = [
  {
    slug: "studio-web",
    name: "Studio — web",
    tagline: "The studio site: bilingual service pages and 32 production case studies.",
    href: "https://ciphercall.dev",
    platform: "WEB",
  },
  {
    slug: "studio-android",
    name: "Studio for Android",
    tagline: "Install the studio app for offline case studies and one-tap contact.",
    href: "https://github.com/ciphercall/rocket-launcher/releases/download/v1.0.0-build100/app-arm64-v8a-release.apk",
    platform: "ANDROID",
  },
  {
    slug: "portfolio-android",
    name: "Portfolio for Android",
    tagline: "The portfolio as a native app: career timeline, projects and CV.",
    href: "https://github.com/ciphercall/rocket-launcher/releases/download/v0.2.0-build102/app-arm64-v8a-release.apk",
    platform: "ANDROID",
  },
];
