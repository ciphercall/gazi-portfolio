import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { nextDuePost, planProjectPosts } from "@/lib/social/planner";
import { publishDueDispatches } from "@/lib/social/publish";
import { formatSlot, isAutoPublishEnabled, socialTimezone } from "@/lib/social/time";

/**
 * The scheduler.
 *
 * One process, one tick a minute, two jobs:
 *
 *   1. plan — give every published project that has no prepared post one, on the
 *      next free day;
 *   2. publish — send everything whose slot has arrived.
 *
 * It exists because "post at 10:00 on the 14th" cannot be expressed with Next's
 * `after()`, which only runs while a request is in flight. This is the smallest
 * thing that can hold a clock.
 *
 * It also writes `next-post.json` into the runtime directory. On the VPS the
 * portfolio stack is stopped when idle, so a host cron reads that file and wakes
 * the stack shortly before a post is due — the scheduler itself does not need to
 * run forever for a scheduled post to happen.
 *
 * Overdue rows are published on the first tick after start, which is what makes
 * a sleeping stack self-correcting rather than merely late.
 */

const TICK_MS = Math.max(Number(process.env.SOCIAL_TICK_MS ?? 60_000) || 60_000, 5_000);
const RUNTIME_DIR = process.env.SOCIAL_RUNTIME_DIR?.trim() || "/app/.runtime";

let stopping = false;
let ticking = false;

function log(message: string): void {
  console.log(`[scheduler] ${new Date().toISOString()} ${message}`);
}

/** Best-effort wake file for the VPS host cron. Failure is never fatal. */
async function writeNextPostFile(): Promise<void> {
  try {
    const next = await nextDuePost();
    await mkdir(RUNTIME_DIR, { recursive: true });
    await writeFile(
      path.join(RUNTIME_DIR, "next-post.json"),
      JSON.stringify(
        next
          ? {
              nextDueAt: next.at.toISOString(),
              display: formatSlot(next.at),
              timezone: socialTimezone(),
              dispatchId: next.id,
              writtenAt: new Date().toISOString(),
            }
          : { nextDueAt: null, timezone: socialTimezone(), writtenAt: new Date().toISOString() },
        null,
        2,
      ),
      "utf8",
    );
  } catch (error) {
    console.error(
      "[scheduler] could not write next-post.json:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

async function tick(): Promise<void> {
  if (ticking || stopping) return;
  ticking = true;

  try {
    const plan = await planProjectPosts();
    if (plan.created > 0) {
      log(`planned ${plan.created} new post(s) across ${plan.total} published project(s)`);
    }

    const due = await publishDueDispatches();
    if (due.skipped) {
      log("tick skipped — another scheduler holds the lease, or auto-publish is off");
    } else if (due.attempted > 0) {
      log(`published ${due.published}, failed ${due.failed} of ${due.attempted} due post(s)`);
    }

    if (!isAutoPublishEnabled()) {
      log("SOCIAL_AUTO_PUBLISH is off — posts stay queued until they are sent by hand");
    }

    await writeNextPostFile();
  } catch (error) {
    console.error(
      "[scheduler] tick failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  } finally {
    ticking = false;
  }
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  log(`${signal} received — stopping`);
  try {
    await prisma.$disconnect();
  } catch {
    // Disconnect is best-effort; the process is going away either way.
  }
  process.exit(0);
}

async function main(): Promise<void> {
  log(
    `started — tick ${Math.round(TICK_MS / 1000)}s, timezone ${socialTimezone()}, auto-publish ${
      isAutoPublishEnabled() ? "on" : "off"
    }`,
  );

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  // Catch-up first: a stack that was asleep for two days has work waiting.
  await tick();

  // A referenced interval is what keeps this process alive — an unresolved
  // promise does not, and an `unref`'d timer would let Node exit right here.
  setInterval(() => void tick(), TICK_MS);
}

void main();
