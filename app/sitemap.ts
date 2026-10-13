import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://flowex-snowy.vercel.app";

const publicPaths = [
  "/",
  "/resources",
  "/resources/automation",
  "/resources/getting-started",
  "/resources/integrations",
  "/resources/lead-capture",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
