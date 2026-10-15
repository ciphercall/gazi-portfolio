import type { Metadata } from "next";
import {
  Briefcase,
  CircleCheck,
  CircleAlert,
  FolderKanban,
  Lock,
  Megaphone,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ConnectionCard } from "@/components/admin/social/ConnectionCard";
import { DispatchLog, type DispatchRow } from "@/components/admin/social/DispatchLog";
import { ManualSharePanel } from "@/components/admin/social/ManualSharePanel";
import { Note, StatusChip } from "@/components/admin/social/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEnv, isLinkedInConfigured, isFacebookConfigured, isSocialPublishingConfigured } from "@/lib/env";
import {
  formatPeriod,
  manualShareFor,
  type ExperienceShareSubject,
  type ProjectShareSubject,
  type ShareSubject,
} from "@/lib/social/manual";
import { listDispatches } from "@/lib/social/publish";
import { providerToSlug, PROVIDERS } from "@/lib/social/types";

/**
 * Social publishing panel.
 *
 * The whole page is one idea: publishing to LinkedIn and Facebook is *posts*,
 * never profile edits, and the parts of it that need no credentials work all the
 * time. So the page leads with what is and is not possible, then shows the two
 * connection cards, then the dispatch log, then — always, connected or not — a
 * manual share panel for every experience and project.
 *
 * Rendered per request (`force-dynamic`): the panel is a live view of tokens,
 * attempts and errors, and a cached version of it would be actively misleading.
 *
 * Nothing on this page ever receives a token. The connection cards are given
 * `displayName`, `accountRef`, `scopes` and two timestamps, and the ciphertext
 * columns are not selected at all.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social publishing",
  robots: { index: false, follow: false },
};

/** Provider-reported or self-generated outcome codes, mapped to plain English. */
const OUTCOME_MESSAGES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  state_missing: {
    tone: "warn",
    text: "The connect attempt lost its security cookie, so it was refused before any code was exchanged. Nothing was connected or stored. Start again from the Connect button.",
  },
  state_invalid: {
    tone: "warn",
    text: "The security check on the callback failed its signature test, so the attempt was refused. Nothing was connected. This is what a tampered or replayed callback looks like.",
  },
  state_expired: {
    tone: "warn",
    text: "That connect attempt took longer than ten minutes, so it expired and was refused. Nothing was connected. Start again from the Connect button.",
  },
  state_mismatch: {
    tone: "warn",
    text: "The callback did not match the attempt that started it — the provider, the nonce or the signature disagreed. Nothing was connected. This is the expected result of a cross-site forgery attempt.",
  },
  missing_code: {
    tone: "warn",
    text: "The provider returned no authorization code, so there was nothing to exchange. Nothing was connected.",
  },
  exchange_failed: {
    tone: "warn",
    text: "The provider rejected the authorization code, or the account details could not be read. Nothing was stored. For Facebook, the usual cause is an account that does not administer a Page — a personal profile cannot be posted to by any API.",
  },
  access_denied: {
    tone: "warn",
    text: "Permission was declined at the provider. Nothing was stored, and the existing connection (if any) is untouched.",
  },
  user_cancelled_login: {
    tone: "warn",
    text: "The sign-in was cancelled at LinkedIn. Nothing was stored.",
  },
  user_cancelled_authorize: {
    tone: "warn",
    text: "The permission request was refused at LinkedIn. Nothing was stored.",
  },
  provider_error: {
    tone: "warn",
    text: "The provider reported an error during the sign-in. Nothing was stored.",
  },
};

const SAFE_CODE = /^[a-z0-9_]{1,40}$/;

function resolveOutcome(code: string) {
  const known = OUTCOME_MESSAGES[code];
  if (known) return known;
  return {
    tone: "warn" as const,
    text: `The provider or the callback reported "${code}". Consult the server log for the matching entry; no token or secret is ever written to it.`,
  };
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export default async function SocialPublishingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const connectedSlug = firstParam(params.connected);
  const errorCode = firstParam(params.error);

  const env = getEnv();

  const [accounts, dispatches, experienceRows, projectRows] = await Promise.all([
    prisma.socialAccount.findMany({
      // Ciphertext is deliberately not selected: the panel has no use for it, so
      // it never enters this render at all.
      select: {
        provider: true,
        accountRef: true,
        displayName: true,
        scopes: true,
        expiresAt: true,
        connectedAt: true,
      },
    }),
    listDispatches(50),
    prisma.experience.findMany({
      orderBy: [{ isPublished: "desc" }, { order: "asc" }, { startDate: "desc" }],
    }),
    prisma.project.findMany({
      orderBy: [{ isPublished: "desc" }, { featured: "desc" }, { order: "asc" }],
    }),
  ]);

  const accountBySlug = new Map(accounts.map((account) => [account.provider, account]));
  const tokenKeyReady = isSocialPublishingConfigured();

  const experienceSubjects: ExperienceShareSubject[] = experienceRows.map((row) => ({
    type: "EXPERIENCE",
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    employmentType: row.employmentType,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    isCurrent: row.isCurrent,
    summary: row.summary,
    bullets: row.bullets,
    tags: row.tags,
    shareText: row.shareText,
    isPublished: row.isPublished,
  }));

  const projectSubjects: ProjectShareSubject[] = projectRows.map((row) => ({
    type: "PROJECT",
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    role: row.role,
    client: row.client,
    year: row.year,
    liveUrl: row.liveUrl,
    repoUrl: row.repoUrl,
    techStack: row.techStack,
    shareText: row.shareText,
    isPublished: row.isPublished,
  }));

  const subjects: ShareSubject[] = [...experienceSubjects, ...projectSubjects];

  const dispatchRows: DispatchRow[] = dispatches.map((entry) => ({
    id: entry.id,
    subjectType: entry.subjectType,
    subjectLabel: entry.subjectLabel,
    subjectUrl: entry.subjectUrl,
    provider: entry.provider,
    status: entry.status,
    message: entry.message,
    permalink: entry.permalink,
    externalId: entry.externalId,
    error: entry.error,
    attempts: entry.attempts,
    postedAt: entry.postedAt ? entry.postedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
  }));

  const readiness = {
    linkedin: {
      configured: isLinkedInConfigured() && tokenKeyReady,
      connected: accountBySlug.has("LINKEDIN"),
    },
    facebook: {
      configured: isFacebookConfigured() && tokenKeyReady,
      connected: accountBySlug.has("FACEBOOK"),
    },
  };

  const connectedProvider = PROVIDERS.find((item) => item.slug === connectedSlug);
  const connectedAccount = connectedProvider
    ? accountBySlug.get(connectedProvider.provider)
    : undefined;

  const errorOutcome = errorCode && SAFE_CODE.test(errorCode) ? resolveOutcome(errorCode) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <span className="label-mono">Admin · publishing</span>
        <h1 className="font-display text-title font-semibold">
          <span className="text-aurora">Social publishing</span>
        </h1>
        <p className="max-w-3xl text-muted">
          Publish posts about your work to LinkedIn and to a Facebook Page, and keep a record of
          every attempt. The manual share panels below need no credentials, no OAuth app and no
          token key — they work right now, whatever the state of the connections above them.
        </p>
      </header>

      <div className="mt-6">
        <Note tone="warning">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Megaphone className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
            This publishes posts. It cannot edit your profile.
          </p>
          <p>
            No API — LinkedIn&rsquo;s, Meta&rsquo;s, or anyone else&rsquo;s — can add to or change
            the &ldquo;Experience&rdquo; section of a LinkedIn profile, and no API can post to a
            personal Facebook profile at all. Nothing in this panel attempts either. What
            connecting does is let this app create <strong className="text-ink">posts</strong> as
            you on LinkedIn and as a Page you administer on Facebook. Updating the Experience
            section stays a manual job on LinkedIn&rsquo;s own site, exactly as before.
          </p>
        </Note>
      </div>

      {connectedProvider ? (
        <div className="mt-4">
          <Note>
            <p className="flex items-center gap-2 text-ink">
              <CircleCheck className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              {connectedProvider.label} is connected
              {connectedAccount?.displayName ? ` as ${connectedAccount.displayName}` : ""}.
            </p>
            <p>
              The token was encrypted before it was stored and is not displayed anywhere. Reconnect
              at any time from the card below; doing so replaces the token and leaves the dispatch
              log alone.
            </p>
          </Note>
        </div>
      ) : null}

      {errorOutcome ? (
        <div className="mt-4">
          <Note tone="warning">
            <p className="flex items-center gap-2 text-ink">
              <CircleAlert className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
              {errorCode === "access_denied"
                ? "Permission was declined at the provider"
                : "That connect attempt did not finish"}
            </p>
            <p>{errorOutcome.text}</p>
          </Note>
        </div>
      ) : null}

      {tokenKeyReady ? null : (
        <div className="mt-4">
          <Note tone="warning">
            <p className="flex items-center gap-2 font-medium text-ink">
              <Lock className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
              SOCIAL_TOKEN_KEY is not set, so no account can be connected
            </p>
            <p>
              Without it the app refuses to store a token rather than writing one out in the clear —
              which is the right refusal, but it does mean connecting is off until the key exists.
              Set <code className="font-mono text-xs text-ink">SOCIAL_TOKEN_KEY</code> (at least 32
              characters) in <code className="font-mono text-xs text-ink">deploy/.env</code>, whose
              shape is documented in{" "}
              <code className="font-mono text-xs text-ink">deploy/.env.example</code>, then restart
              the stack. The manual share panels keep working either way.
            </p>
          </Note>
        </div>
      )}

      <section className="mt-10 space-y-4" aria-labelledby="connections-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="connections-heading" className="font-display text-lg font-semibold text-ink">
            Connections
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-faint">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tokens are encrypted at rest and never rendered
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const account = accountBySlug.get(provider.provider);
            const expired = Boolean(account?.expiresAt && account.expiresAt.getTime() < Date.now());
            const slug = providerToSlug(provider.provider);

            return (
              <ConnectionCard
                key={slug}
                slug={slug}
                label={provider.label}
                capability={provider.capability}
                missing={[
                  ...(slug === "linkedin"
                    ? [
                        !env.LINKEDIN_CLIENT_ID ? "LINKEDIN_CLIENT_ID" : null,
                        !env.LINKEDIN_CLIENT_SECRET ? "LINKEDIN_CLIENT_SECRET" : null,
                      ]
                    : [
                        !env.FACEBOOK_APP_ID ? "FACEBOOK_APP_ID" : null,
                        !env.FACEBOOK_APP_SECRET ? "FACEBOOK_APP_SECRET" : null,
                      ]),
                  ...(tokenKeyReady ? [] : ["SOCIAL_TOKEN_KEY"]),
                ].filter((value): value is string => value !== null)}
                redirectUri={new URL(`/api/social/${slug}/callback`, env.SITE_URL).toString()}
                returnTo="/admin/social"
                account={
                  account
                    ? {
                        displayName: account.displayName,
                        accountRef: account.accountRef,
                        scopes: account.scopes,
                        connectedAt: account.connectedAt.toISOString(),
                        expiresAt: account.expiresAt ? account.expiresAt.toISOString() : null,
                      }
                    : null
                }
                expired={expired}
                bootstrapHint={`Regenerate it with "portfolio-deploy.ps1 -Action env", which copies deploy/.env.example to deploy/.env.`}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="log-heading">
        <h2 id="log-heading" className="sr-only">
          Dispatch log
        </h2>
        <DispatchLog rows={dispatchRows} readiness={readiness} />
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="manual-heading">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 id="manual-heading" className="font-display text-lg font-semibold text-ink">
            Manual share
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Always available — needs no credentials
          </span>
        </div>

        <p className="max-w-3xl text-sm text-muted">
          These panels are generated on the server and rendered as ordinary links, so they work
          without JavaScript, without an OAuth app and before any account is connected. Each one
          opens the provider&rsquo;s own composer with the text prefilled; you review it there and
          press publish yourself.
        </p>

        {subjects.length === 0 ? (
          <Note>
            <p>
              There is no content to share yet. Add an experience or a project first — each one gets
              its own panel here with generated post text and prefilled LinkedIn and Facebook links.
            </p>
          </Note>
        ) : (
          <div className="space-y-4">
            {experienceSubjects.map((subject) => {
              const bundle = manualShareFor(subject);
              return (
                <ManualSharePanel
                  key={`experience-${subject.id}`}
                  subjectType="EXPERIENCE"
                  title={subject.title}
                  subtitle={[subject.company, formatPeriod(subject)].filter(Boolean).join(" · ")}
                  isPublished={subject.isPublished}
                  text={bundle.text}
                  url={bundle.url}
                  linkedinHref={bundle.linkedin}
                  facebookHref={bundle.facebook}
                  copyText={bundle.copyText}
                />
              );
            })}

            {projectSubjects.map((subject) => {
              const bundle = manualShareFor(subject);
              return (
                <ManualSharePanel
                  key={`project-${subject.id}`}
                  subjectType="PROJECT"
                  title={subject.title}
                  subtitle={[subject.role, subject.year ? String(subject.year) : null]
                    .filter(Boolean)
                    .join(" · ")}
                  isPublished={subject.isPublished}
                  text={bundle.text}
                  url={bundle.url}
                  linkedinHref={bundle.linkedin}
                  facebookHref={bundle.facebook}
                  copyText={bundle.copyText}
                />
              );
            })}
          </div>
        )}
      </section>

      <footer className="mt-10 border-t border-line pt-6 pb-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-faint">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            LinkedIn: {readiness.linkedin.configured ? "configured" : "not configured"} ·{" "}
            {readiness.linkedin.connected ? "connected" : "not connected"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Facebook: {readiness.facebook.configured ? "configured" : "not configured"} ·{" "}
            {readiness.facebook.connected ? "connected" : "not connected"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {experienceSubjects.length} experiences · {projectSubjects.length} projects
          </span>
          <span className="ml-auto">Status legend: </span>
          <StatusChip status="POSTED" />
          <StatusChip status="QUEUED" />
          <StatusChip status="NEEDS_RECONNECT" />
        </div>
      </footer>
    </main>
  );
}
