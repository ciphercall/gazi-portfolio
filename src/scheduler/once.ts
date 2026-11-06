import { stat } from "node:fs/promises";

import { prisma } from "@/lib/db";
import { resolveMediaAbsolutePath } from "@/lib/media/storage";
import { ensureCardForDispatch } from "@/lib/social/card";
import { deleteSetting, readSetting, writeSecretSetting } from "@/lib/social/credentials";
import { nextDuePost, planProjectPosts } from "@/lib/social/planner";
import { publishDueDispatches } from "@/lib/social/publish";
import { formatSlot } from "@/lib/social/time";

/**
 * One-shot scheduler commands, for the deploy script and for a quick manual run.
 *
 *   plan        — prepare a post for every published project that has none
 *   publish-due — send everything whose slot has arrived
 *   status      — print what is scheduled and what is next
 *   card <id>   — render the card for one dispatch (by id or project slug)
 *   selftest    — prove the machinery works without touching LinkedIn
 *
 * Runs inside the `app` container (`npx tsx src/scheduler/once.ts plan`), where
 * `127.0.0.1:3000` is the live Next server — so the card renderer works here
 * without any extra configuration.
 */

async function renderCard(target: string): Promise<void> {
  const byId = await prisma.socialDispatch.findUnique({ where: { id: target }, select: { id: true } });
  const dispatch =
    byId ??
    (await prisma.socialDispatch.findFirst({
      where: { project: { slug: target } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }));

  if (!dispatch) {
    console.error(`No dispatch found for "${target}".`);
    process.exitCode = 2;
    return;
  }

  const url = await ensureCardForDispatch(dispatch.id);
  console.log(url ? `card: ${url}` : "card: not rendered");
}

async function selfTest(): Promise<void> {
  const failures: string[] = [];

  const [total, distinctDays] = await Promise.all([
    prisma.socialDispatch.count({ where: { provider: "LINKEDIN" } }),
    prisma.$queryRaw<{ days: bigint }[]>`
      SELECT COUNT(DISTINCT "scheduledDay") AS days FROM "social_dispatches"
    `,
  ]);
  const days = Number(distinctDays[0]?.days ?? 0);
  if (total === 0) failures.push("no prepared posts — run `plan` first");
  if (days !== total) failures.push(`one-post-per-day broken: ${days} days for ${total} posts`);
  console.log(`  posts              ${total} rows, ${days} distinct days`);

  // Encryption round trip on a throwaway key.
  let encryptedOk = false;
  try {
    await writeSecretSetting("social.selftest", "plaintext-probe-42");
    const stored = await prisma.appSetting.findUnique({ where: { key: "social.selftest" } });
    const readBack = await readSetting("social.selftest");
    encryptedOk =
      readBack === "plaintext-probe-42" &&
      Boolean(stored?.value) &&
      !stored!.value.includes("plaintext-probe-42");
    await deleteSetting("social.selftest");
  } catch (error) {
    failures.push(
      `encryption round trip failed: ${error instanceof Error ? error.message : "unknown"}`,
    );
  }
  console.log(`  encryption at rest ${encryptedOk ? "ciphertext verified" : "FAILED"}`);
  if (!encryptedOk && failures.length === 0) failures.push("credential encryption did not verify");

  // Planning must be idempotent.
  const replan = await planProjectPosts();
  if (replan.created !== 0) failures.push(`planner created ${replan.created} duplicate post(s)`);
  console.log(`  planner idempotent  created ${replan.created} on a second run`);

  // The card renderer must produce a real PNG on the media volume.
  const first = await prisma.socialDispatch.findFirst({
    where: { provider: "LINKEDIN", status: "QUEUED" },
    orderBy: { scheduledFor: "asc" },
    select: { id: true },
  });
  if (!first) {
    failures.push("no queued post to render a card for");
  } else {
    const url = await ensureCardForDispatch(first.id);
    if (!url) {
      failures.push("card render returned nothing");
    } else {
      try {
        const info = await stat(resolveMediaAbsolutePath(url));
        if (info.size < 10_000) failures.push(`card is suspiciously small (${info.size} bytes)`);
        console.log(`  card render        ${url} (${Math.round(info.size / 1024)} KB)`);
      } catch {
        failures.push(`card file missing on the media volume: ${url}`);
      }
    }
  }

  const next = await nextDuePost();
  console.log(`  next post          ${next ? formatSlot(next.at) : "none"}`);

  if (failures.length === 0) {
    console.log("\nSELFTEST PASSED");
    return;
  }

  console.error("\nSELFTEST FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "status";

  switch (mode) {
    case "plan": {
      const result = await planProjectPosts();
      console.log(
        `planned ${result.created} new post(s); ${result.total} published project(s) in total`,
      );
      break;
    }
    case "publish-due": {
      const result = await publishDueDispatches(10);
      console.log(
        result.skipped
          ? "skipped — auto-publish is off or another run holds the lease"
          : `attempted ${result.attempted}, published ${result.published}, failed ${result.failed}`,
      );
      break;
    }
    case "status": {
      const [prepared, posted, next] = await Promise.all([
        prisma.socialDispatch.count({ where: { status: "QUEUED" } }),
        prisma.socialDispatch.count({ where: { status: "POSTED" } }),
        nextDuePost(),
      ]);
      console.log(`${prepared} prepared · ${posted} posted`);
      console.log(next ? `next: ${formatSlot(next.at)}` : "next: nothing scheduled");
      break;
    }
    case "card": {
      const target = process.argv[3];
      if (!target) {
        console.error("Usage: once.ts card <dispatchId|projectSlug>");
        process.exitCode = 2;
        break;
      }
      await renderCard(target);
      break;
    }
    case "selftest":
      await selfTest();
      break;
    default:
      console.error(`Unknown command "${mode}". Use plan, publish-due, status, card or selftest.`);
      process.exitCode = 2;
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      "[scheduler:once] failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
