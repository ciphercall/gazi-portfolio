import type { MetadataRoute } from "next";

import { getProjectSummaries } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

/**
 * Sitemap.
 *
 * `force-dynamic` because the production image is built without a Postgres
 * connection: a sitemap that queried the database at build time would fail the
 * image, so it is generated per request instead. If the database is down the
 * static routes are still returned — a partial sitemap beats a 500.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/projects"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/experience"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const projects = await getProjectSummaries();
    const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...projectRoutes];
  } catch (error) {
    console.error("[sitemap] project routes unavailable:", error);
    return staticRoutes;
  }
}
