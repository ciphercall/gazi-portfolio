import type { Metadata } from "next";
import {
  Briefcase,
  CalendarClock,
  CircleCheck,
  CircleAlert,
  FolderKanban,
  Lock,
  Megaphone,
  ScrollText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ConnectionCard } from "@/components/admin/social/ConnectionCard";
import { DispatchLog, type DispatchRow } from "@/components/admin/social/DispatchLog";
import { ManualSharePanel } from "@/components/admin/social/ManualSharePanel";
import { SchedulePlanner, type PlannerRow } from "@/components/admin/social/SchedulePlanner";
import { ActionLink, Note, StatusChip } from "@/components/admin/social/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEnv, isSocialPublishingConfigured } from "@/lib/env";
import { getSocialCredentials } from "@/lib/social/credentials";
import {
  formatPeriod,
  manualShareFor,
  type ExperienceShareSubject,
  type ProjectShareSubject,
  type ShareSubject,
} from "@/lib/social/manual";
import { nextDuePost, planningDefaults } from "@/lib/social/planner";
import {
  listPostedDispatches,
  listPreparedDispatches,
  type DispatchLogEntry,
} from "@/lib/social/publish";
import {
  addDays,
  formatSlot,
  slotParts,
  todayBucket,
} from "@/lib/social/time";
import { providerToSlug, PROVIDERS } from "@/lib/social/types";

/**
 * The publishing page.
 *
 * Three questions, in the order they are asked:
 *
 *   1. What is already live?  → the **Posted** list
 *   2. What is waiting, and when?  → the **Prepared** list + the planner
 *   3. What will it look like?  → the editor's LinkedIn preview
 *
 * The manual share panels stay at the bottom. They need no credentials and no
 * account, which is what keeps this page useful on the first day.
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
    text: "The callback did not match the attempt that started it — the provider, the nonce or the signature disagreed. Nothing was connected.",
  },
  missing_code: {
    tone: "warn",
    text: "The provider returned no authorization code, so there was nothing to exchange. Nothing was connected.",
  },
  exchange_failed: {
    tone: "warn",
    text: "The provider rejected the authorization code, or the account details could not be read. Nothing was stored. For Facebook, the usual cause is an account that does not administer a Page.",
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

/**
 * Whether each stored token has passed its expiry, computed once per request.
 *
 * Kept out of the component body so the render contains no impure call: reading
 * the clock during render is exactly what makes a component non-deterministic.
 */
async function expiryByProvider(
  accounts: { provider: string; expiresAt: Date | null }[],
): Promise<Map<string, boolean>> {
  const now = Date.now();
  return new Map(
    accounts.map((account) => [
      account.provider,
      Boolean(account.expiresAt && account.expiresAt.getTime() < now),
    ]),
  );
}

function toDispatchRow(entry: DispatchLogEntry): DispatchRow {
  return {
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
    scheduledFor: entry.scheduledFor ? entry.scheduledFor.toISOString() : null,
    imagePath: entry.imagePath,
    postedAt: entry.postedAt ? entry.postedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
  };
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

  const [accounts, postedEntries, preparedEntries, experienceRows, projectRows, profile, defaults, creds, autoPublishStored, nextDue] =
    await Promise.all([
      prisma.socialAccount.findMany({
        select: {
          provider: true,
          accountRef: true,
          displayName: true,
          scopes: true,
          expiresAt: true,
          connectedAt: true,
        },
      }),
      listPostedDispatches(100),
      listPreparedDispatches(200),
      prisma.experience.findMany({
        orderBy: [{ isPublished: "desc" }, { order: "asc" }, { startDate: "desc" }],
      }),
      prisma.project.findMany({
        where: { isPublished: true },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.profile.findUnique({ where: { id: "profile" } }),
      planningDefaults(),
      getSocialCredentials(),
      prisma.appSetting.findUnique({ where: { key: "social.autoPublish" } }),
      nextDuePost(),
    ]);

  const timezone = defaults.timezone;
  const tokenKeyReady = isSocialPublishingConfigured();
  const accountBySlug = new Map(accounts.map((account) => [account.provider, account]));
  const expiredByProvider = await expiryByProvider(accounts);

  const readiness = {
    linkedin: { configured: creds.linkedin !== null && tokenKeyReady, connected: accountBySlug.has("LINKEDIN") },
    facebook: { configured: creds.facebook !== null && tokenKeyReady, connected: accountBySlug.has("FACEBOOK") },
  };

  const postedRows = postedEntries.map(toDispatchRow);
  const preparedRows = preparedEntries.map(toDispatchRow);

  // One row per published project. A project's dispatch is whichever row this
  // project already owns — prepared first, then posted.
  const dispatchByProject = new Map<string, DispatchLogEntry>();
  for (const entry of postedEntries) if (entry.subjectType === "PROJECT") dispatchByProject.set(entry.subjectId, entry);
  for (const entry of preparedEntries) if (entry.subjectType === "PROJECT") dispatchByProject.set(entry.subjectId, entry);

  const fallbackBucket = addDays(todayBucket(timezone), 1);
  const fallbackParts = slotParts(
    new Date(fallbackBucket.getTime() + 10 * 60 * 60 * 1000),
    timezone,
  );

  const plannerRows: PlannerRow[] = projectRows.map((project) => {
    const entry = dispatchByProject.get(project.id);
    const parts = entry?.scheduledFor
      ? slotParts(entry.scheduledFor, timezone)
      : { date: fallbackParts.date, time: defaults.time };

    return {
      projectId: project.id,
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      selected: Boolean(entry),
      dispatchId: entry?.id ?? null,
      status: entry?.status ?? null,
      message: entry?.message ?? "",
      date: parts.date,
      time: parts.time,
      error: entry?.error ?? null,
      imagePath: entry?.imagePath ?? null,
      permalink: entry?.permalink ?? null,
      manualEdit: entry?.manualEdit ?? false,
    };
  });

  const nextDueLabel = nextDue ? formatSlot(nextDue.at, timezone) : null;
  const autoPublish = autoPublishStored?.value !== "false" && env.SOCIAL_AUTO_PUBLISH !== "false";

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

  const connectedProvider = PROVIDERS.find((item) => item.slug === connectedSlug);
  const connectedAccount = connectedProvider ? accountBySlug.get(connectedProvider.provider) : undefined;
  const errorOutcome = errorCode && SAFE_CODE.test(errorCode) ? resolveOutcome(errorCode) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <span className="label-mono">Admin · publishing</span>
        <h1 className="font-display text-title font-semibold">
          <span className="text-aurora">LinkedIn publishing</span>
        </h1>
        <p className="max-w-3xl text-muted">
          Every published project gets a prepared post, placed one per day. Posts are sent to your
          LinkedIn profile automatically at their scheduled time and appear in the Posted list with a
          link to the live post.
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/admin/social/settings" icon={Settings2} variant="primary">
            API keys &amp; schedule settings
          </ActionLink>
          <span className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-panel px-3.5 py-2 text-sm text-muted">
            <CalendarClock className="size-4 shrink-0 text-teal" aria-hidden="true" />
            {nextDueLabel ? `Next post ${nextDueLabel}` : "Nothing scheduled yet"}
          </span>
        </div>
      </header>

      <div className="mt-6">
        <Note tone="warning">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Megaphone className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
            This publishes posts. It cannot edit your profile.
          </p>
          <p>
            No API can add to or change the &ldquo;Experience&rdquo; section of a LinkedIn profile.
            What connecting does is let this app create <strong className="text-ink">posts</strong>{" "}
            as you. Updating the Experience section stays a manual job on LinkedIn&rsquo;s own site.
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
              at any time from the card below.
            </p>
          </Note>
        </div>
      ) : null}

      {errorOutcome ? (
        <div className="mt-4">
          <Note tone="warning">
            <p className="flex items-center gap-2 text-ink">
              <CircleAlert className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
              {errorCode === "access_denied" ? "Permission was declined at the provider" : "That connect attempt did not finish"}
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
              SOCIAL_TOKEN_KEY is not set, so no credential can be stored and no account connected
            </p>
            <p>
              Run <code className="font-mono text-xs text-ink">portfolio-deploy.ps1 -Action env</code>{" "}
              (it generates the key) and restart the stack. The schedules and previews still work
              without it; only sending needs it.
            </p>
          </Note>
        </div>
      )}

      <section className="mt-8" aria-labelledby="planner-heading">
        <h2 id="planner-heading" className="sr-only">
          Schedule planner
        </h2>
        <SchedulePlanner
          rows={plannerRows}
          author={{
            name: profile?.fullName ?? env.SITE_NAME,
            headline: profile?.headline ?? "Full-stack developer",
            avatarUrl: profile?.avatarPath ?? null,
          }}
          timezone={timezone}
          postTime={defaults.time}
          autoPublish={autoPublish}
          linkedInConnected={readiness.linkedin.connected}
          nextDueLabel={nextDueLabel}
        />
      </section>

      <section className="mt-8 space-y-6" aria-labelledby="lists-heading">
        <h2 id="lists-heading" className="sr-only">
          Posted and prepared posts
        </h2>

        <DispatchLog
          rows={preparedRows}
          readiness={readiness}
          title="Prepared — not posted yet"
          description={
            <p>
              Scheduled and failed posts, soonest first. A failed row keeps the provider&rsquo;s own
              error text; retry it once the cause is fixed.
            </p>
          }
          emptyMessage="No prepared posts. Every published project gets one as soon as the scheduler ticks, or press “Plan new projects” above."
        />

        <DispatchLog
          rows={postedRows}
          readiness={readiness}
          title="Posted"
          description={
            <p>
              Everything already live on LinkedIn, with the permalink the provider returned. These
              rows are history and cannot be deleted or re-sent.
            </p>
          }
          emptyMessage="Nothing has been posted yet."
        />
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="connections-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="connections-heading" className="font-display text-lg font-semibold text-ink">
            Connections
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-faint">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tokens are encrypted at rest and never rendered
          </span>
          <a href="/admin/social/settings" className="ml-auto text-xs text-cyan underline underline-offset-2">
            Enter API keys
          </a>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const account = accountBySlug.get(provider.provider);
            const expired = expiredByProvider.get(provider.provider) ?? false;
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
                        !creds.linkedin ? "LinkedIn client ID and secret" : null,
                      ]
                    : [!creds.facebook ? "Facebook app ID and secret" : null]),
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
                bootstrapHint="Enter them on /admin/social/settings — no restart needed."
              />
            );
          })}
        </div>
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
          Generated on the server and rendered as ordinary links, so they work without JavaScript,
          without an OAuth app and before any account is connected. Each one opens the
          provider&rsquo;s own composer with the text prefilled.
        </p>

        {subjects.length === 0 ? (
          <Note>
            <p>There is no content to share yet. Add a project first.</p>
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
            {postedRows.length} posted · {preparedRows.length} prepared
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
