import type { MetadataRoute } from "next";
import { PROJECTS, SITE_URL } from "@/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...PROJECTS.map((p) => ({ url: `${SITE_URL}/casos/${p.slug}/` })),
  ];
}
