import type { Metadata } from "next";
import { CalendarClock, ExternalLink, Eye, Settings2 } from "lucide-react";

import { CredentialsForm } from "@/components/admin/social/CredentialsForm";
import { requireAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { getSocialCredentials, readSetting } from "@/lib/social/credentials";
import { planningDefaults } from "@/lib/social/planner";
import { ActionLink, Panel, ReadOnlyField } from "@/components/admin/social/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publishing settings",
  robots: { index: false, follow: false },
};

export default async function SocialSettingsPage() {
  await requireAdmin();

  const [creds, defaults, autoPublishStored, accounts, env] = await Promise.all([
    getSocialCredentials(),
    planningDefaults(),
    readSetting("social.autoPublish"),
    prisma.socialAccount.findMany({ select: { provider: true } }),
    Promise.resolve(getEnv()),
  ]);

  const connected = new Set(accounts.map((account) => account.provider));
  const tokenKeyReady = Boolean(env.SOCIAL_TOKEN_KEY && env.SOCIAL_TOKEN_KEY.length >= 32);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <span className="label-mono">Admin · publishing · settings</span>
        <h1 className="font-display text-title font-semibold">
          <span className="text-aurora">LinkedIn settings</span>
        </h1>
        <p className="max-w-3xl text-muted">
          Supply the API credentials here once your LinkedIn app is approved. They are encrypted
          before they are stored and take effect immediately — no redeploy, no restart, and the
          panel never shows a stored secret back to you.
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/admin/social" icon={CalendarClock}>
            Back to the schedule
          </ActionLink>
          <ActionLink href="/admin/social" icon={Eye}>
            Posted &amp; prepared lists
          </ActionLink>
        </div>
      </header>

      <section className="mt-6">
        <Panel title="Where these values come from" description={<p>Environment fallback, when a database value is absent.</p>}>
          <div className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-2">
            <ReadOnlyField
              label="SITE_URL (redirect host)"
              value={<span className="font-mono text-xs break-all">{env.SITE_URL}</span>}
            />
            <ReadOnlyField
              label="Encryption key"
              value={
                tokenKeyReady
                  ? "SOCIAL_TOKEN_KEY is set"
                  : "SOCIAL_TOKEN_KEY is missing — saving is disabled"
              }
            />
          </div>
        </Panel>
      </section>

      <section className="mt-6">
        <CredentialsForm
          tokenKeyReady={tokenKeyReady}
          linkedinConfigured={creds.linkedin !== null}
          facebookConfigured={creds.facebook !== null}
          linkedinConnected={connected.has("LINKEDIN")}
          facebookConnected={connected.has("FACEBOOK")}
          linkedinRedirect={new URL("/api/social/linkedin/callback", env.SITE_URL).toString()}
          facebookRedirect={new URL("/api/social/facebook/callback", env.SITE_URL).toString()}
          timezone={defaults.timezone}
          postTime={defaults.time}
          autoPublish={autoPublishStored !== "false"}
        />
      </section>

      <footer className="mt-8 border-t border-line pt-5 pb-8 text-xs text-faint">
        <p className="inline-flex items-center gap-1.5">
          <Settings2 className="size-3.5" aria-hidden="true" />
          Each field is write-only: leave it blank to keep the stored value, or type
          <code className="mx-1 font-mono">__clear__</code> to remove it.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5">
          <ExternalLink className="size-3.5" aria-hidden="true" />
          The scheduling page is at{" "}
          <a href="/admin/social" className="text-cyan underline underline-offset-2">
            /admin/social
          </a>
        </p>
      </footer>
    </main>
  );
}
