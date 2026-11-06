import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getSocialCredentials, readSetting } from "@/lib/social/credentials";
import {
  buildShareText,
  publicUrlForSubject,
  type ProjectShareSubject,
} from "@/lib/social/manual";
import {
  addDays,
  dayBucket,
  localDayKey,
  slotInstant,
  socialPostTime,
  socialTimezone,
  todayBucket,
} from "@/lib/social/time";

/**
 * The post planner.
 *
 * Every published project gets exactly one prepared LinkedIn post, and the
 * planner owns that invariant. It runs from the scheduler tick, from the admin
 * "Auto-schedule" button, and when a project is saved — so a project added today
 * has a slot today, and a plan the admin rewrote by hand is never clobbered.
 *
 * The one-post-per-day rule is enforced twice on purpose: here, so the admin gets
 * a readable error before saving, and by the unique index on
 * `(provider, scheduledDay)`, so two tabs or a replayed request cannot get past it.
 */

export const PLANNER_PROVIDER = "LINKEDIN" as const;

/** Setting keys the admin panel writes for this feature. */
export const SCHEDULE_SETTINGS = {
  timezone: "social.timezone",
  postTime: "social.postTime",
  autoPublish: "social.autoPublish",
} as const;

/**
 * Effective scheduling defaults: the admin panel's value when set, otherwise the
 * environment's, otherwise the built-in 10:00 Asia/Dhaka.
 */
export async function planningDefaults(): Promise<{ time: string; timezone: string }> {
  const [storedTime, storedZone] = await Promise.all([
    readSetting(SCHEDULE_SETTINGS.postTime),
    readSetting(SCHEDULE_SETTINGS.timezone),
  ]);
  return {
    time: storedTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(storedTime) ? storedTime : socialPostTime(),
    timezone: storedZone ?? socialTimezone(),
  };
}

export interface PlannerSlotOptions {
  /** Wall-clock time, `HH:mm`. Defaults to SOCIAL_POST_TIME (10:00). */
  timeOfDay?: string;
  /** IANA zone. Defaults to SOCIAL_TIMEZONE (Asia/Dhaka). */
  timezone?: string;
  /** First day that may be used. Defaults to tomorrow. */
  startDay?: Date;
}

export interface PlanResult {
  created: number;
  updated: number;
  total: number;
}

function projectSubject(project: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  role: string | null;
  client: string | null;
  year: number | null;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  shareText: string;
  isPublished: boolean;
}): ProjectShareSubject {
  return {
    type: "PROJECT",
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    client: project.client,
    year: project.year,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    techStack: project.techStack,
    shareText: project.shareText,
    isPublished: project.isPublished,
  };
}

/** Copy for a project's LinkedIn post: admin text if written, generated otherwise. */
export function postCopyFor(project: Parameters<typeof projectSubject>[0]): string {
  // 3000 characters is LinkedIn's documented post limit; the builder already
  // clamps well below it, this is just the last line of defence.
  return buildShareText(projectSubject(project)).slice(0, 3000);
}

/**
 * The next `count` free daily slots, one per calendar day, skipping days already
 * occupied by any scheduled dispatch for this provider.
 */
export async function nextFreeSlots(
  count: number,
  options: PlannerSlotOptions = {},
): Promise<Date[]> {
  const defaults = await planningDefaults();
  const timezone = options.timezone ?? defaults.timezone;
  const time = options.timeOfDay ?? defaults.time;
  const takenRows = await prisma.socialDispatch.findMany({
    where: { provider: PLANNER_PROVIDER, scheduledDay: { not: null } },
    select: { scheduledDay: true },
  });

  const taken = new Set(
    takenRows
      .map((row) => row.scheduledDay)
      .filter((day): day is Date => day !== null)
      .map((day) => dayBucket(day, "UTC").toISOString().slice(0, 10)),
  );

  const slots: Date[] = [];
  let cursor = options.startDay ?? addDays(todayBucket(timezone), 1);

  // A year of searching is far beyond any real backlog; the guard exists so a
  // pathological data set cannot spin forever.
  for (let day = 0; day < 800 && slots.length < count; day += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!taken.has(key)) {
      slots.push(slotInstant(cursor, time, timezone));
      taken.add(key);
    }
    cursor = addDays(cursor, 1);
  }

  return slots;
}

/**
 * Ensure every published project has a prepared post with a slot.
 *
 * Idempotent: a project that already has any dispatch for this provider is left
 * alone, so re-running never creates duplicates and never moves a date the admin
 * picked.
 */
export async function planProjectPosts(options: PlannerSlotOptions = {}): Promise<PlanResult> {
  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  const existing = await prisma.socialDispatch.findMany({
    where: { provider: PLANNER_PROVIDER, subjectType: "PROJECT" },
    select: { id: true, projectId: true, status: true },
  });

  const withDispatch = new Set(existing.map((row) => row.projectId).filter(Boolean) as string[]);
  const pending = projects.filter((project) => !withDispatch.has(project.id));

  if (pending.length === 0) {
    return { created: 0, updated: 0, total: projects.length };
  }

  const defaults = await planningDefaults();
  const timezone = options.timezone ?? defaults.timezone;
  const slots = await nextFreeSlots(pending.length, { ...options, timezone, timeOfDay: defaults.time });

  let created = 0;
  for (const [index, project] of pending.entries()) {
    const slot = slots[index];
    if (!slot) break;

    try {
      await prisma.socialDispatch.create({
        data: {
          subjectType: "PROJECT",
          subjectId: project.id,
          projectId: project.id,
          provider: PLANNER_PROVIDER,
          status: "QUEUED",
          message: postCopyFor(project),
          scheduledFor: slot,
          scheduledDay: dayBucket(slot, timezone),
        },
      });
      created += 1;
    } catch {
      // The unique (provider, scheduledDay) index refused this slot — another
      // writer took the day between the read and the insert. Leaving the project
      // unplanned for this tick is correct: the next tick assigns a free day.
    }
  }

  return { created, updated: 0, total: projects.length };
}

/** Move one prepared post to a specific local date + time. */
export async function rescheduleDispatch(
  dispatchId: string,
  input: { date: string; time: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { timezone } = await planningDefaults();
  const slot = slotInstant(dateBucketFrom(input.date), input.time, timezone);
  const bucket = dayBucket(slot, timezone);

  const dispatch = await prisma.socialDispatch.findUnique({
    where: { id: dispatchId },
    select: { id: true, provider: true, status: true, scheduledDay: true },
  });

  if (!dispatch) return { ok: false, message: "That post no longer exists." };
  if (dispatch.status === "POSTED") {
    return { ok: false, message: "That post has already been published — its date is history." };
  }

  const clash = await prisma.socialDispatch.findFirst({
    where: {
      provider: dispatch.provider,
      scheduledDay: bucket,
      NOT: { id: dispatch.id },
    },
    select: { id: true },
  });

  if (clash) {
    return {
      ok: false,
      message: "Another post is already scheduled on that day. Only one post per day is allowed.",
    };
  }

  await prisma.socialDispatch.update({
    where: { id: dispatch.id },
    data: { scheduledFor: slot, scheduledDay: bucket },
  });

  return { ok: true };
}

/** `YYYY-MM-DD` → DATE bucket. Local helper so this module owns no date parsing. */
function dateBucketFrom(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Pick a date first.");
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/**
 * Select or deselect one project for posting.
 *
 * Deselecting deletes a prepared (QUEUED/DRAFT) row and leaves published history
 * alone — deleting a POSTED row would erase the record of something that is
 * already live on LinkedIn, which is not a thing the panel is allowed to do.
 */
export async function setProjectSelected(
  projectId: string,
  selected: boolean,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, isPublished: true },
  });

  if (!project) return { ok: false, message: "That project no longer exists." };
  if (!project.isPublished) {
    return { ok: false, message: "Publish the project before selecting it for LinkedIn." };
  }

  const existing = await prisma.socialDispatch.findFirst({
    where: { provider: PLANNER_PROVIDER, subjectType: "PROJECT", projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, postedAt: true },
  });

  if (selected) {
    if (existing) {
      return { ok: true, message: "That project is already selected." };
    }
    const [slot] = await nextFreeSlots(1);
    if (!slot) {
      return { ok: false, message: "No free day left in the next two years — clear a slot first." };
    }
    const full = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    await prisma.socialDispatch.create({
      data: {
        subjectType: "PROJECT",
        subjectId: projectId,
        projectId,
        provider: PLANNER_PROVIDER,
        status: "QUEUED",
        message: postCopyFor(full),
        scheduledFor: slot,
        scheduledDay: dayBucket(slot),
      },
    });
    return { ok: true, message: "Project selected — a post is prepared and scheduled." };
  }

  if (!existing) return { ok: true, message: "That project was not selected." };
  if (existing.status === "POSTED") {
    return { ok: false, message: "That project was already posted — it stays in the Posted list." };
  }

  await prisma.socialDispatch.delete({ where: { id: existing.id } });
  return { ok: true, message: "Project removed from the schedule." };
}

/**
 * Re-plan from scratch for projects with no dispatch, and compact the calendar so
 * the remaining prepared posts occupy consecutive days. POSTED rows keep their
 * historical day.
 */
export async function autoScheduleAll(): Promise<{ scheduled: number }> {
  const { timezone, time } = await planningDefaults();
  const prepared = await prisma.socialDispatch.findMany({
    where: { provider: PLANNER_PROVIDER, status: { in: ["QUEUED", "DRAFT"] } },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  // Free the calendar first: clear the day of every row we are about to move, so
  // the unique index never fights the update below.
  await prisma.socialDispatch.updateMany({
    where: { id: { in: prepared.map((row) => row.id) } },
    data: { scheduledFor: null, scheduledDay: null },
  });

  const slots = await nextFreeSlots(prepared.length, { timezone, timeOfDay: time });
  let scheduled = 0;
  for (const [index, row] of prepared.entries()) {
    const slot = slots[index];
    if (!slot) break;
    await prisma.socialDispatch.update({
      where: { id: row.id },
      data: { scheduledFor: slot, scheduledDay: dayBucket(slot, timezone) },
    });
    scheduled += 1;
  }

  const planned = await planProjectPosts({ timezone, timeOfDay: time });
  return { scheduled: scheduled + planned.created };
}

/**
 * The next post due, for the scheduler's wake file and the admin panel banner.
 * Uses the configured zone for display only; the comparison is on the instant.
 */
export async function nextDuePost(): Promise<{ at: Date; id: string } | null> {
  const row = await prisma.socialDispatch.findFirst({
    where: { provider: PLANNER_PROVIDER, status: "QUEUED", scheduledFor: { not: null } },
    orderBy: { scheduledFor: "asc" },
    select: { id: true, scheduledFor: true },
  });
  if (!row || !row.scheduledFor) return null;
  return { at: row.scheduledFor, id: row.id };
}

/** `Asia/Dhaka`, resolved from settings then env. */
export async function plannerTimezone(): Promise<string> {
  return (await planningDefaults()).timezone;
}

/** `10:00`, resolved from settings then env. */
export async function plannerTime(): Promise<string> {
  return (await planningDefaults()).time;
}

/** Rewrite a prepared post's copy from its project, unless it was edited by hand. */
export async function refreshPreparedCopy(projectId: string): Promise<void> {
  const prepared = await prisma.socialDispatch.findFirst({
    where: {
      provider: PLANNER_PROVIDER,
      subjectType: "PROJECT",
      projectId,
      status: { in: ["QUEUED", "DRAFT"] },
    },
    select: { id: true, manualEdit: true },
  });

  if (!prepared || prepared.manualEdit) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  await prisma.socialDispatch.update({
    where: { id: prepared.id },
    data: { message: postCopyFor(project) },
  });
}

/** `YYYY-MM-DD` of a bucket, in the scheduling zone. */
export function bucketKey(bucket: Date, timezone = socialTimezone()): string {
  return localDayKey(bucket, timezone);
}

/** Reads the credential state without importing the resolver into the UI layer. */
export async function plannerLinkedInReady(): Promise<boolean> {
  return (await getSocialCredentials()).linkedin !== null;
}

/** Kept for callers that need the configured site origin. */
export function siteOrigin(): string {
  return getEnv().SITE_URL.replace(/\/+$/, "");
}

/** Share URL of a project, for the preview's link line. */
export function projectPublicUrl(slug: string): string {
  return publicUrlForSubject({
    type: "PROJECT",
    id: "",
    slug,
    title: "",
    summary: "",
    role: null,
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: [],
    shareText: "",
    isPublished: true,
  });
}
