import { describe, expect, it } from "vitest";

import { manifestUrlFor, pickLatestApk } from "./app-releases";

const manifest = {
  app_id: "gazi-portfolio",
  version_name: "0.3.5",
  version_code: 108,
  apks: {
    "arm64-v8a": {
      url: "https://example.com/app-arm64.apk",
      size_bytes: 25411498,
      sha256: "abc",
    },
    "armeabi-v7a": {
      url: "https://example.com/app-armeabi.apk",
      size_bytes: 21340878,
      sha256: "def",
    },
  },
};

describe("pickLatestApk", () => {
  it("prefers the arm64 asset", () => {
    const release = pickLatestApk(manifest);
    expect(release?.versionName).toBe("0.3.5");
    expect(release?.versionCode).toBe(108);
    expect(release?.apk.url).toBe("https://example.com/app-arm64.apk");
    expect(release?.apk.sizeBytes).toBe(25411498);
  });

  it("falls back to armeabi when arm64 is absent", () => {
    const release = pickLatestApk({
      ...manifest,
      apks: { "armeabi-v7a": manifest.apks["armeabi-v7a"] },
    });
    expect(release?.apk.url).toBe("https://example.com/app-armeabi.apk");
  });

  it("rejects malformed manifests instead of throwing", () => {
    expect(pickLatestApk(null)).toBeNull();
    expect(pickLatestApk({})).toBeNull();
    expect(pickLatestApk({ version_code: 0, apks: {} })).toBeNull();
    expect(pickLatestApk({ version_code: 10, apks: { "arm64-v8a": { url: "" } } })).toBeNull();
  });

  it("only resolves links that have a known manifest", () => {
    expect(manifestUrlFor("portfolio-android")).toContain("gazi-portfolio/manifest.json");
    expect(manifestUrlFor("studio-android")).toContain("studio-app/manifest.json");
    expect(manifestUrlFor("studio-web")).toBeNull();
  });
});
