import type { Metadata } from "next";

import { getProfile } from "@/lib/queries";
import {
  contactLinks,
  type ContactHandles,
  type ContactLinks,
} from "@/components/site/contact-links";

/**
 * SEO plumbing shared by every public route.
 *
 * Two rules drive the shape of this module:
 *   1. Absolute URLs everywhere. Crawlers and the Flutter client both read these
 *      values outside a browser context, so nothing here is allowed to be a bare
 *      path.
 *   2. Nothing queries the database at module scope. `SITE_URL` comes from the
 *      environment; profile data is fetched per request by the caller, because
 *      the Docker image is built without a reachable Postgres.
 */

export const SITE_NAME = (process.env.SITE_NAME ?? "").trim() || "Gazi Monir-Uz-Zaman";

export const SITE_URL = (
  (process.env.SITE_URL ?? "").trim() || "http://localhost:8023"
).replace(/\/+$/, "");

/** Copy used when the profile row is missing or a field is blank. */
export const DEFAULT_HEADLINE = "Senior Laravel & React Full-Stack Developer";

/** The route Next serves the generated `opengraph-image.tsx` at. */
export const OG_IMAGE_PATH = "/opengraph-image";

/** The profile row, as the site consumes it. */
export type SiteProfile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

/**
 * Profile or a loud failure. A portfolio with no profile row is a deployment
 * mistake (the seed action did not run), and saying so beats rendering an
 * empty hero and leaving someone to wonder why the site looks broken.
 */
export async function requireProfile(): Promise<SiteProfile> {
  const profile = await getProfile();
  if (!profile) {
    throw new Error(
      "Profile content is missing. The site has nothing to render — run the seed action first.",
    );
  }
  return profile;
}

/** Non-throwing variant for chrome that can degrade gracefully. */
export async function loadProfile(): Promise<SiteProfile | null> {
  return getProfile();
}

/**
 * Profile for `generateMetadata`, which must never take a whole route down: a
 * metadata failure would replace a working page with an error screen.
 */
export async function loadProfileSafe(): Promise<SiteProfile | null> {
  try {
    return await getProfile();
  } catch {
    return null;
  }
}

export function absoluteUrl(path = "/"): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Meta descriptions are cut at a word boundary — no mid-word ellipses. */
export function truncate(value: string, max = 158): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/* --------------------------------------------------------------- metadata --- */

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

/**
 * Per-page metadata. The OpenGraph image is set explicitly rather than relied on
 * through inheritance — an explicit URL cannot silently disappear when a child
 * declares its own `openGraph` block.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const description = truncate(input.description);
  const image = { url: absoluteUrl(OG_IMAGE_PATH), width: 1200, height: 630, alt: SITE_NAME };

  return {
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: input.title,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [absoluteUrl(OG_IMAGE_PATH)],
    },
  };
}

/* --------------------------------------------------------------- JSON-LD --- */

export type JsonLdNode = Record<string, unknown>;

export function profileLinks(handles: ContactHandles): ContactLinks {
  return contactLinks(handles);
}

function personNode(profile: SiteProfile, links: ContactLinks): JsonLdNode {
  const sameAs = [links.linkedin, links.github, links.facebook].filter(
    (value): value is string => Boolean(value),
  );

  const node: JsonLdNode = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: profile.fullName,
    jobTitle: profile.headline,
    description: truncate(profile.summary, 320),
    url: `${SITE_URL}/`,
  };

  if (profile.avatarPath) node.image = absoluteUrl(profile.avatarPath);
  if (links.email) node.email = links.email;
  if (profile.phone) node.telephone = profile.phone;
  if (profile.location) {
    node.address = { "@type": "PostalAddress", addressLocality: profile.location };
  }
  if (sameAs.length > 0) node.sameAs = sameAs;
  if (profile.websiteUrl) node.mainEntityOfPage = { "@type": "WebPage", "@id": `${SITE_URL}/` };

  return node;
}

export function personJsonLd(profile: SiteProfile, links: ContactLinks): JsonLdNode {
  return { "@context": "https://schema.org", ...personNode(profile, links) };
}

export function profilePageJsonLd(profile: SiteProfile, links: ContactLinks): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personNode(profile, links),
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profilepage`,
        url: `${SITE_URL}/`,
        name: `${profile.fullName} — ${profile.headline}`,
        description: truncate(profile.summary, 250),
        dateModified: profile.updatedAt.toISOString(),
        mainEntity: { "@id": `${SITE_URL}/#person` },
        isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/` },
      },
    ],
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; path: string; description?: string }[],
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
      ...(item.description ? { description: truncate(item.description, 180) } : {}),
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
