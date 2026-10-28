import type { ReactNode } from "react";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import {
  EMPTY_HANDLES,
  contactLinks,
  type ContactHandles,
} from "@/components/site/contact-links";
import { DEFAULT_HEADLINE, SITE_NAME, loadProfile } from "@/lib/seo";

/**
 * Public site shell: header, main, footer.
 *
 * `force-dynamic` is the important line here. The production image is built
 * without a reachable Postgres, so nothing under this layout may be evaluated
 * while the image is being built — every page in this subtree renders per
 * request, against the live database, and never at build time.
 */
export const dynamic = "force-dynamic";

function handlesFrom(profile: Awaited<ReturnType<typeof loadProfile>>): ContactHandles {
  if (!profile) return EMPTY_HANDLES;
  return {
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    facebookUrl: profile.facebookUrl,
    messengerUsername: profile.messengerUsername,
    websiteUrl: profile.websiteUrl,
  };
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // A missing profile degrades the chrome rather than the whole route: the pages
  // that genuinely need content call `requireProfile()` and say so plainly.
  const profile = await loadProfile();

  const fullName = profile?.fullName.trim() || SITE_NAME;
  const headline = profile?.headline.trim() || DEFAULT_HEADLINE;
  const handles = handlesFrom(profile);
  const links = contactLinks(handles);

  return (
    <div id="top" className="relative flex min-h-dvh flex-col">
      <AmbientBackground />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:border focus:border-line-strong focus:bg-canvas focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
        >
          Skip to content
        </a>

        <SiteNav fullName={fullName} tagline={headline} />

        {/*
          A neutral wrapper, not a <main>: each page owns its own main landmark so
          pages in this group that bring their own (the CV download page does)
          cannot end up with nested <main> elements. The skip link still lands here.
        */}
        <div id="main" className="flex-1">
          {children}
        </div>

        <SiteFooter
          fullName={fullName}
          headline={headline}
          location={profile?.location ?? ""}
          summary={profile?.summary ?? ""}
          handles={handles}
          links={links}
        />
      </div>
    </div>
  );
}
