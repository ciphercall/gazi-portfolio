import { facebookAdapter } from "@/lib/social/facebook";
import { linkedInAdapter } from "@/lib/social/linkedin";

import type { Provider, ProviderSlug, SocialProviderAdapter } from "@/lib/social/types";

/**
 * The one place that maps a provider onto its adapter.
 *
 * Kept apart from `publish.ts` so the connect and callback routes can resolve an
 * adapter without importing a module that pulls in `next/server`'s `after()`,
 * and so adding a provider is a single-line change here plus one new file.
 */

const REGISTRY: Readonly<Record<ProviderSlug, SocialProviderAdapter>> = {
  linkedin: linkedInAdapter,
  facebook: facebookAdapter,
};

export function adapterForSlug(slug: ProviderSlug): SocialProviderAdapter {
  return REGISTRY[slug];
}

export function adapterForProvider(provider: Provider): SocialProviderAdapter {
  return REGISTRY[provider === "LINKEDIN" ? "linkedin" : "facebook"];
}

/** Every adapter, in panel order. */
export function allAdapters(): readonly SocialProviderAdapter[] {
  return [linkedInAdapter, facebookAdapter];
}
