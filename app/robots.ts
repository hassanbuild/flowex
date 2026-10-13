import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://flowex-snowy.vercel.app";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/api/",
        "/billing",
        "/checkout",
        "/connections",
        "/dashboard",
        "/f/",
        "/form/",
        "/home",
        "/lead-capture/",
        "/login",
        "/settings",
        "/signup",
        "/upgrade",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
