/**
 * Latest-build lookup for the mobile apps the portfolio promotes.
 *
 * The rocket launcher publishes one OTA manifest per app. Reading it on the
 * server means the web always points at the newest APK the moment a build is
 * published, while the admin-managed href stays as the offline fallback.
 */

export interface ReleaseApk {
  url: string;
  sizeBytes: number;
  sha256: string;
}

export interface LatestRelease {
  versionName: string;
  versionCode: number;
  apk: ReleaseApk;
}

const MANIFESTS: Record<string, string> = {
  "portfolio-android":
    "https://raw.githubusercontent.com/ciphercall/rocket-launcher/main/ota/gazi-portfolio/manifest.json",
  "studio-android":
    "https://raw.githubusercontent.com/ciphercall/rocket-launcher/main/ota/studio-app/manifest.json",
};

export function manifestUrlFor(slug: string): string | null {
  return MANIFESTS[slug] ?? null;
}

/** Pure manifest parser; exported so the shape handling is unit-tested. */
export function pickLatestApk(manifest: unknown): LatestRelease | null {
  if (!manifest || typeof manifest !== "object") return null;

  const record = manifest as Record<string, unknown>;
  const versionCode = Number(record.version_code);
  if (!Number.isFinite(versionCode) || versionCode <= 0) return null;

  const apks = record.apks;
  if (!apks || typeof apks !== "object") return null;

  const map = apks as Record<string, unknown>;
  const preferred = map["arm64-v8a"] ?? map["armeabi-v7a"] ?? Object.values(map)[0];
  if (!preferred || typeof preferred !== "object") return null;

  const apk = preferred as Record<string, unknown>;
  const url = typeof apk.url === "string" ? apk.url : "";
  if (!url) return null;

  return {
    versionName: typeof record.version_name === "string" ? record.version_name : "",
    versionCode,
    apk: {
      url,
      sizeBytes: Number(apk.size_bytes) || 0,
      sha256: typeof apk.sha256 === "string" ? apk.sha256 : "",
    },
  };
}

export async function fetchLatestRelease(slug: string): Promise<LatestRelease | null> {
  const manifestUrl = manifestUrlFor(slug);
  if (!manifestUrl) return null;

  try {
    // Revalidated every five minutes: a freshly published APK shows up without
    // a redeploy, and a launch-day traffic spike does not hammer GitHub.
    const response = await fetch(manifestUrl, {
      next: { revalidate: 300 },
      headers: { "cache-control": "no-cache" },
    });
    if (!response.ok) return null;
    return pickLatestApk(await response.json());
  } catch {
    return null;
  }
}
