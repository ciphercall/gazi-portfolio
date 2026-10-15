import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Link2, MinusCircle, Settings2 } from "lucide-react";
import Link from "next/link";

import { SeoForm } from "@/components/admin/forms/seo-form";
import { ReadOnlyField, StatusChip } from "@/components/admin/fields";
import { AdminPageFrame, AdminPageHeader, AdminSection } from "@/components/admin/page-frame";
import { getProfileRow } from "@/lib/admin/data";
import { formatTimestamp } from "@/lib/admin/format";
import { resolveDmLinks } from "@/lib/admin/links";
import { requireAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * Integrations are reported through `getEnv()`, which throws when the required
 * variables are missing. A settings page that 500s because of a missing optional
 * key would be worse than useless, so each probe is isolated.
 */
function probe(fn: (env: ReturnType<typeof getEnv>) => boolean): boolean {
  try {
    return fn(getEnv());
  } catch {
    return false;
  }
}

export default async function AdminSettingsPage() {
  await requireAdmin();

  const profile = await getProfileRow();

  const links = profile
    ? resolveDmLinks({
        whatsapp: profile.whatsapp,
        messengerUsername: profile.messengerUsername,
        linkedinUrl: profile.linkedinUrl,
        facebookUrl: profile.facebookUrl,
        email: profile.email,
        phone: profile.phone,
        websiteUrl: profile.websiteUrl,
        githubUrl: profile.githubUrl,
      })
    : [];

  const integrations = [
    {
      key: "token-key",
      label: "Social token encryption (SOCIAL_TOKEN_KEY)",
      configured: probe((env) => Boolean(env.SOCIAL_TOKEN_KEY && env.SOCIAL_TOKEN_KEY.length >= 32)),
      required: false,
      note: "Without this key the OAuth connect flow refuses to store a token rather than saving it in plaintext. The manual share links work regardless.",
    },
    {
      key: "linkedin",
      label: "LinkedIn publishing (LINKEDIN_CLIENT_ID / SECRET)",
      configured: probe((env) => Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET)),
      required: false,
      note: "Needs your own LinkedIn app with the Share on LinkedIn product approved.",
    },
    {
      key: "facebook",
      label: "Facebook Page publishing (FACEBOOK_APP_ID / SECRET)",
      configured: probe((env) => Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET)),
      required: false,
      note: "Publishing targets a Facebook Page. Meta does not allow API posting to a personal profile.",
    },
  ];

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Configuration"
          icon={Settings2}
          title="Settings"
          description="Search metadata, integration status and a live preview of the DM links visitors will get."
        />
      }
    >
      <div className="flex flex-col gap-5">
        <AdminSection
          title="Search & link preview"
          description="Used by the page metadata and every social share card."
          icon={Settings2}
        >
          {profile ? (
            <SeoForm
              initialSeoTitle={profile.seoTitle}
              initialSeoDescription={profile.seoDescription}
            />
          ) : (
            <p className="text-sm text-muted">
              No profile row yet.{" "}
              <Link href="/admin/profile" className="text-teal underline underline-offset-2">
                Create the profile first
              </Link>
              , then come back here.
            </p>
          )}
        </AdminSection>

        <AdminSection
          title="Optional integrations"
          description="Everything here is optional. Nothing on the public site depends on it."
          icon={AlertTriangle}
        >
          <ul className="flex flex-col gap-3">
            {integrations.map((integration) => (
              <li
                key={integration.key}
                className="flex flex-wrap items-start justify-between gap-3 rounded-control border border-line bg-canvas-2/30 px-3 py-3"
              >
                <div className="min-w-0 max-w-xl">
                  <p className="font-mono text-xs text-ink">{integration.label}</p>
                  <p className="mt-1 text-xs text-faint">{integration.note}</p>
                </div>
                {integration.configured ? (
                  <StatusChip tone="ok">
                    <CheckCircle2 aria-hidden className="size-3" />
                    Configured
                  </StatusChip>
                ) : (
                  <StatusChip tone="off">
                    <MinusCircle aria-hidden className="size-3" />
                    Not configured
                  </StatusChip>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-faint">
            Set these in <span className="font-mono">gazi-portfolio/deploy/.env</span> and restart
            the stack. The keys are documented in{" "}
            <span className="font-mono">deploy/.env.example</span>.
          </p>
        </AdminSection>

        <AdminSection
          title="Direct-message links"
          description="Derived from the Profile handles. This is exactly what the buttons on the public site will open."
          icon={Link2}
        >
          {profile ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {links.map((link) => (
                  <ReadOnlyField
                    key={link.key}
                    label={link.label}
                    value={
                      link.href ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-teal underline underline-offset-2"
                        >
                          {link.href}
                        </a>
                      ) : (
                        <span className="text-faint">
                          Not set — add it on the{" "}
                          <Link href="/admin/profile" className="underline underline-offset-2">
                            Profile page
                          </Link>
                        </span>
                      )
                    }
                    hint={link.source ? `from: ${link.source}` : undefined}
                    mono
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-faint">
                Profile last updated {formatTimestamp(profile.updatedAt) ?? "never"}.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">No profile row yet.</p>
          )}
        </AdminSection>
      </div>
    </AdminPageFrame>
  );
}
