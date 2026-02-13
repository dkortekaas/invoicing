import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://declair.app";

export default function robots(): MetadataRoute.Robots {
  const base = BASE_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/facturen/", "/klanten/", "/producten/", "/kosten/", "/leveranciers/", "/tijd/", "/btw/", "/abonnementen/", "/instellingen/", "/pay/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
