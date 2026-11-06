"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { isSocialPublishingConfigured } from "@/lib/env";
import {
  clearCredentialsCache,
  CREDENTIAL_KEYS,
  deleteSetting,
  getSocialCredentials,
  writeSecretSetting,
  writeSetting,
} from "@/lib/social/credentials";
import { SCHEDULE_SETTINGS } from "@/lib/social/planner";

/**
 * Settings writes for the publishing feature.
 *
 * Credential fields are write-only from the browser's point of view: a blank
 * value means "keep what is stored", and the literal `__clear__` removes it. The
 * panel never receives a stored secret back, so it cannot be read out of the page.
 */

export type SettingsActionResult =
  | { ok: true; message: string; data?: Record<string, unknown> }
  | { ok: false; message: string };

const CLEAR = "__clear__";

function failure(error: unknown, fallback: string): SettingsActionResult {
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}

function refresh(): void {
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/settings");
}

export interface CredentialsInput {
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
}

/** Save provider credentials. Blank keeps, `__clear__` removes. */
export async function saveCredentialsAction(
  input: CredentialsInput,
): Promise<SettingsActionResult> {
  await requireAdmin();

  if (!isSocialPublishingConfigured()) {
    return {
      ok: false,
      message:
        "SOCIAL_TOKEN_KEY is not set, so credentials cannot be encrypted. Set it in deploy/.env and restart, or run '-Action env'.",
    };
  }

  const fields: { key: string; value: string | undefined; label: string }[] = [
    { key: CREDENTIAL_KEYS.linkedinClientId, value: input.linkedinClientId, label: "LinkedIn client ID" },
    {
      key: CREDENTIAL_KEYS.linkedinClientSecret,
      value: input.linkedinClientSecret,
      label: "LinkedIn client secret",
    },
    { key: CREDENTIAL_KEYS.facebookAppId, value: input.facebookAppId, label: "Facebook app ID" },
    {
      key: CREDENTIAL_KEYS.facebookAppSecret,
      value: input.facebookAppSecret,
      label: "Facebook app secret",
    },
  ];

  try {
    let saved = 0;
    for (const field of fields) {
      const raw = field.value?.trim();
      if (!raw) continue;
      if (raw === CLEAR) {
        await deleteSetting(field.key);
        saved += 1;
        continue;
      }
      if (raw.length < 6) {
        return { ok: false, message: `${field.label} looks too short to be valid.` };
      }
      await writeSecretSetting(field.key, raw);
      saved += 1;
    }

    clearCredentialsCache();
    refresh();
    return {
      ok: true,
      message: saved === 0 ? "Nothing changed." : `Saved ${saved} credential value(s).`,
    };
  } catch (error) {
    return failure(error, "The credentials could not be saved.");
  }
}

export async function saveScheduleSettingsAction(input: {
  timezone: string;
  postTime: string;
  autoPublish: boolean;
}): Promise<SettingsActionResult> {
  await requireAdmin();

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.postTime)) {
    return { ok: false, message: "Post time must be HH:MM in 24-hour form (for example 10:00)." };
  }

  try {
    // Validate the zone instead of storing a value Intl would silently ignore.
    new Intl.DateTimeFormat("en-CA", { timeZone: input.timezone });
  } catch {
    return { ok: false, message: `"${input.timezone}" is not a valid IANA time zone.` };
  }

  try {
    await writeSetting(SCHEDULE_SETTINGS.timezone, input.timezone);
    await writeSetting(SCHEDULE_SETTINGS.postTime, input.postTime);
    await writeSetting(SCHEDULE_SETTINGS.autoPublish, input.autoPublish ? "true" : "false");
    clearCredentialsCache();
    refresh();
    return {
      ok: true,
      message: "Schedule defaults saved. Existing posts keep their dates until you re-run Auto-schedule.",
    };
  } catch (error) {
    return failure(error, "The schedule defaults could not be saved.");
  }
}

/**
 * Check the connected LinkedIn account still accepts its token.
 *
 * Reads the stored ciphertext, decrypts for this one request only, and reports
 * who it belongs to. Nothing about the token leaves this function.
 */
export async function testLinkedInAction(): Promise<SettingsActionResult> {
  await requireAdmin();

  const account = await prisma.socialAccount.findUnique({ where: { provider: "LINKEDIN" } });
  if (!account) {
    return { ok: false, message: "No LinkedIn account is connected yet — use Connect LinkedIn." };
  }

  let token: string;
  try {
    token = decryptSecret(account.accessTokenEnc);
  } catch {
    return {
      ok: false,
      message: "The stored token cannot be decrypted — reconnect LinkedIn.",
    };
  }

  try {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return {
        ok: false,
        message: `LinkedIn rejected the stored token (HTTP ${response.status}). Reconnect the account.`,
      };
    }
    const info = (await response.json()) as { name?: string; sub?: string };
    return {
      ok: true,
      message: `LinkedIn answers as ${info.name ?? account.displayName}. Credentials and token are valid.`,
    };
  } catch (error) {
    return failure(error, "LinkedIn could not be reached.");
  }
}

/** Current credential presence, without exposing any value. */
export async function credentialStatusAction(): Promise<{ ok: true; data: Record<string, boolean> }> {
  await requireAdmin();
  const creds = await getSocialCredentials();
  return {
    ok: true,
    data: {
      linkedinId: creds.linkedin !== null,
      linkedinSecret: creds.linkedin !== null,
      facebookId: creds.facebook !== null,
      facebookSecret: creds.facebook !== null,
    },
  };
}
