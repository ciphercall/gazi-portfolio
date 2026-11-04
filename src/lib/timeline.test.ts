// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  TIMELINE_MIN_WIDTH_PCT,
  buildTimeline,
  overlapSummary,
  type TimelineEntry,
} from "./timeline";

function role(overrides: Partial<TimelineEntry> & Pick<TimelineEntry, "slug">): TimelineEntry {
  return {
    title: "Developer",
    company: "Acme",
    employmentType: "FULL_TIME",
    startDate: "2020-01-01",
    endDate: null,
    isCurrent: false,
    ...overrides,
  };
}

describe("buildTimeline", () => {
  it("rounds the domain out to whole years", () => {
    const layout = buildTimeline(
      [role({ slug: "a", startDate: "2020-06-15", endDate: "2021-03-01" })],
      { today: "2024-01-01" },
    );

    expect(layout.domainStartMs).toBe(Date.UTC(2020, 0, 1));
    expect(layout.domainEndMs).toBe(Date.UTC(2022, 0, 1));
    expect(layout.years).toEqual([2020, 2021]);
  });

  it("stacks real overlaps into separate lanes and shares a lane for back-to-back roles", () => {
    const layout = buildTimeline(
      [
        role({ slug: "a", startDate: "2020-01-01", endDate: "2021-01-01" }),
        role({ slug: "b", startDate: "2020-06-01", endDate: "2021-06-01" }),
        role({ slug: "c", startDate: "2021-06-01", endDate: "2022-01-01" }),
      ],
      { today: "2024-01-01" },
    );

    const laneOf = (slug: string) => layout.placed.find((item) => item.key === slug)?.lane;

    expect(layout.laneCount).toBe(2);
    expect(layout.hasOverlap).toBe(true);
    expect(laneOf("a")).toBe(0);
    expect(laneOf("b")).toBe(1);
    expect(laneOf("c")).toBe(0);
  });

  it("ends an open-ended role at today", () => {
    const layout = buildTimeline(
      [role({ slug: "current", startDate: "2024-01-01", isCurrent: true, endDate: null })],
      { today: "2024-07-01" },
    );

    expect(layout.hasCurrent).toBe(true);
    const placed = layout.placed[0];
    expect(placed?.endMs).toBe(Date.UTC(2024, 6, 1));
    expect(placed?.openEnded).toBe(true);
    expect(layout.nowPct).toBeGreaterThan(0);
    expect(layout.nowPct).toBeLessThan(100);
  });

  it("ignores a stale end date when the role is marked current", () => {
    const layout = buildTimeline(
      [role({ slug: "current", startDate: "2023-01-01", isCurrent: true, endDate: "2023-02-01" })],
      { today: "2024-01-01" },
    );

    expect(layout.placed[0]?.endMs).toBe(Date.UTC(2024, 0, 1));
  });

  it("keeps short roles visible without overflowing the axis", () => {
    const layout = buildTimeline(
      [
        role({ slug: "long", startDate: "2017-01-01", endDate: "2024-01-01" }),
        role({ slug: "brief", startDate: "2024-12-01", endDate: "2024-12-02" }),
      ],
      { today: "2025-01-01" },
    );

    for (const item of layout.placed) {
      expect(item.widthPct).toBeGreaterThanOrEqual(TIMELINE_MIN_WIDTH_PCT);
      expect(item.leftPct + item.widthPct).toBeLessThanOrEqual(100);
    }
  });

  it("thins the year ticks in the compact variant", () => {
    const entries = [role({ slug: "a", startDate: "2017-04-01", endDate: "2024-10-01" })];
    const full = buildTimeline(entries, { today: "2024-11-01", variant: "full" });
    const compact = buildTimeline(entries, { today: "2024-11-01", variant: "compact" });

    expect(full.years).toEqual([2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    expect(compact.years.length).toBeLessThan(full.years.length);
    expect(compact.years).toContain(2017);
    expect(compact.years).toContain(2024);
  });

  it("skips entries without a usable start date", () => {
    const layout = buildTimeline(
      [role({ slug: "broken", startDate: "" }), role({ slug: "ok" })],
      { today: "2024-01-01" },
    );

    expect(layout.placed.map((item) => item.key)).toEqual(["ok"]);
  });

  it("returns an empty layout when there is nothing to place", () => {
    const layout = buildTimeline([], { today: "2024-01-01" });

    expect(layout.placed).toEqual([]);
    expect(layout.laneCount).toBe(0);
    expect(layout.hasCurrent).toBe(false);
  });
});

describe("overlapSummary", () => {
  it("returns only the roles whose dates genuinely intersect", () => {
    const entries = [
      role({ slug: "target", startDate: "2020-01-01", endDate: "2021-01-01" }),
      role({ slug: "overlapping", company: "Overlap Ltd", startDate: "2020-06-01", endDate: "2020-12-01" }),
      role({ slug: "after", company: "After Ltd", startDate: "2021-01-01", endDate: "2021-06-01" }),
    ];

    const overlaps = overlapSummary(entries, "target", { today: "2024-01-01" });

    expect(overlaps.map((item) => item.slug)).toEqual(["overlapping"]);
    expect(overlaps[0]?.company).toBe("Overlap Ltd");
  });

  it("counts an open-ended role against a role it ran alongside", () => {
    const entries = [
      role({ slug: "current", startDate: "2024-01-01", isCurrent: true, endDate: null }),
      role({ slug: "side", startDate: "2024-02-01", endDate: "2024-08-01" }),
    ];

    const overlaps = overlapSummary(entries, "current", { today: "2024-06-01" });

    expect(overlaps.map((item) => item.slug)).toEqual(["side"]);
  });

  it("returns nothing for an unknown key", () => {
    const entries = [role({ slug: "a" })];

    expect(overlapSummary(entries, "missing", { today: "2024-01-01" })).toEqual([]);
  });
});
