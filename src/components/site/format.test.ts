// @vitest-environment node

import { describe, expect, it } from "vitest";

import { headlineShort } from "./format";
import { PROFILE } from "../../data/cv-seed";

describe("headlineShort", () => {
  it("keeps only the first pipe-delimited segment", () => {
    expect(headlineShort("Senior Engineer (9+ Yrs) | PHP | React")).toBe("Senior Engineer (9+ Yrs)");
  });

  it("returns a headline with no separators unchanged", () => {
    expect(headlineShort("Senior Engineer")).toBe("Senior Engineer");
  });

  it("falls back when the headline is blank", () => {
    expect(headlineShort("", "Fallback Title")).toBe("Fallback Title");
    expect(headlineShort(null, "Fallback Title")).toBe("Fallback Title");
  });

  it("derives the display headline from the canonical profile headline", () => {
    // The long title exists for LinkedIn/SEO parity; layouts must never render it whole.
    expect(PROFILE.headline).toContain(" | ");
    expect(headlineShort(PROFILE.headline)).toBe("Senior Full-Stack Software Engineer (9+ Yrs)");
    expect(headlineShort(PROFILE.headline).length).toBeLessThan(PROFILE.headline.length);
  });
});
