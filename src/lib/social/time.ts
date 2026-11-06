/**
 * Scheduling time maths.
 *
 * Posts are scheduled in a human wall-clock time in one timezone ("10:00 in
 * Asia/Dhaka"), but stored as an instant and a calendar day. Getting that
 * conversion wrong is the classic off-by-a-day bug, so it happens here once,
 * through `Intl` rather than a date library — Node ships full ICU in the image,
 * and a dependency would be a larger thing to trust for four functions.
 *
 * The day bucket matters more than it looks: it is the value behind the unique
 * index that stops two posts landing on the same day, so it must be the *local*
 * day, not the UTC one. A 00:30 Dhaka post is still the same local day as a
 * 23:30 one, even though the UTC dates differ.
 */

const DEFAULT_TIMEZONE = "Asia/Dhaka";
const DEFAULT_POST_TIME = "10:00";

/** Configured scheduling timezone, validated loosely — a bad value falls back. */
export function socialTimezone(): string {
  const configured = process.env.SOCIAL_TIMEZONE?.trim();
  if (!configured) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: configured });
    return configured;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** `HH:mm` default post time; anything malformed falls back to 10:00. */
export function socialPostTime(): string {
  const configured = process.env.SOCIAL_POST_TIME?.trim();
  if (configured && /^([01]\d|2[0-3]):[0-5]\d$/.test(configured)) return configured;
  return DEFAULT_POST_TIME;
}

export function isAutoPublishEnabled(): boolean {
  const raw = process.env.SOCIAL_AUTO_PUBLISH?.trim().toLowerCase();
  if (raw === undefined || raw === "") return true;
  return !["0", "false", "no", "off"].includes(raw);
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function wallClockIn(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const pick = (type: string): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number(found.value) : 0;
  };

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (east is positive). */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const clock = wallClockIn(date, timeZone);
  const asUtc = Date.UTC(
    clock.year,
    clock.month - 1,
    clock.day,
    clock.hour,
    clock.minute,
    clock.second,
  );
  // Seconds may round; compare at whole-second resolution.
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** `YYYY-MM-DD` for the local calendar day of `date`. */
export function localDayKey(date: Date, timeZone = socialTimezone()): string {
  const clock = wallClockIn(date, timeZone);
  return `${String(clock.year).padStart(4, "0")}-${String(clock.month).padStart(2, "0")}-${String(clock.day).padStart(2, "0")}`;
}

/**
 * The local calendar day as a `DATE`-shaped Date (UTC midnight of that day).
 * This is what goes into `SocialDispatch.scheduledDay`.
 */
export function dayBucket(date: Date, timeZone = socialTimezone()): Date {
  const clock = wallClockIn(date, timeZone);
  return new Date(Date.UTC(clock.year, clock.month - 1, clock.day));
}

/** Today's bucket as seen in the scheduling timezone. */
export function todayBucket(timeZone = socialTimezone()): Date {
  return dayBucket(new Date(), timeZone);
}

/** Bucket `n` days after `bucket`. Pure UTC arithmetic on a DATE value. */
export function addDays(bucket: Date, days: number): Date {
  return new Date(bucket.getTime() + days * 86_400_000);
}

/**
 * Convert a wall-clock time ("10:00") on a `DATE` bucket into the UTC instant.
 *
 * Two passes: the first offset is computed from the naive guess, the second from
 * the corrected instant, which settles DST transitions instead of landing an
 * hour off on the one day a year it matters.
 */
export function slotInstant(bucket: Date, time = socialPostTime(), timeZone = socialTimezone()): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const naive = Date.UTC(
    bucket.getUTCFullYear(),
    bucket.getUTCMonth(),
    bucket.getUTCDate(),
    hours ?? 0,
    minutes ?? 0,
  );

  const firstGuess = naive - zoneOffsetMs(new Date(naive), timeZone);
  const settled = naive - zoneOffsetMs(new Date(firstGuess), timeZone);
  return new Date(settled);
}

/** `"2026-11-07 10:00 (Asia/Dhaka)"` — how the admin panel shows a slot. */
export function formatSlot(instant: Date, timeZone = socialTimezone()): string {
  const clock = wallClockIn(instant, timeZone);
  const date = `${String(clock.year).padStart(4, "0")}-${String(clock.month).padStart(2, "0")}-${String(clock.day).padStart(2, "0")}`;
  const time = `${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`;
  return `${date} ${time} (${timeZone})`;
}

/** Local `YYYY-MM-DD` and `HH:mm` split, for the date/time inputs in the panel. */
export function slotParts(
  instant: Date,
  timeZone = socialTimezone(),
): { date: string; time: string } {
  const clock = wallClockIn(instant, timeZone);
  return {
    date: `${String(clock.year).padStart(4, "0")}-${String(clock.month).padStart(2, "0")}-${String(clock.day).padStart(2, "0")}`,
    time: `${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`,
  };
}

/** `YYYY-MM-DD` → DATE bucket, independent of the server's own timezone. */
export function bucketFromDateInput(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Pick a date in YYYY-MM-DD form.");
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
