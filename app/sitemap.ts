import type { MetadataRoute } from "next";
import { getPostSlugs } from "@/lib/blog";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://declair.nl";

/** Slug-pagina’s onder /functies (zelfde set als in featureConfig) */
const FUNCTIE_SLUGS = [
  "facturen-en-offertes",
  "betalingen",
  "onkosten-en-bonnetjes",
  "projecten-en-uren",
  "rapportages-en-belasting",
  "koppelingen",
] as const;

function url(path: string): string {
  return `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: url(""), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("contact"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("prijzen"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("functies"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("blog"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: url("help"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: url("privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("algemene-voorwaarden"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("cookie-beleid"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("login"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: url("register"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const functiePages: MetadataRoute.Sitemap = FUNCTIE_SLUGS.map((slug) => ({
    url: url(`functies/${slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogSlugs = getPostSlugs();
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: url(`blog/${slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...functiePages, ...blogPages];
}
