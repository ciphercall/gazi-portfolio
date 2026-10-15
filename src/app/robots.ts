import type { MetadataRoute } from "next";

import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Crawl rules.
 *
 * `/admin` is the panel and `/render` is the internal print surface Chromium
 * loads to produce the CV PDFs — neither should ever appear in a search result.
 * Everything else, including the versioned API, is public.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/render"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
