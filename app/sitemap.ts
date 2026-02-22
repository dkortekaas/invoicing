import type { MetadataRoute } from "next";
import { getPostSlugs } from "@/lib/blog";
import { nlPathToEn, featureSlugMap } from "@/lib/i18n-routes";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://declair.app";

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

/** Zet NL-pad om naar EN URL-path (zonder leading slash). */
function enPath(nlPath: string): string {
  const full = nlPath === "" ? "/" : nlPath.startsWith("/") ? nlPath : `/${nlPath}`;
  return nlPathToEn(full).replace(/^\//, "");
}

function entry(
  path: string,
  opts: { changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }
): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: url(path), lastModified: now, ...opts },
    { url: url(enPath(path)), lastModified: now, ...opts },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: Array<[string, MetadataRoute.Sitemap[0]["changeFrequency"], number]> = [
    ["", "weekly", 1],
    ["contact", "monthly", 0.8],
    ["prijzen", "monthly", 0.9],
    ["functies", "monthly", 0.9],
    ["blog", "weekly", 0.8],
    ["help", "monthly", 0.6],
    ["roadmap", "monthly", 0.7],
    ["privacy", "yearly", 0.4],
    ["algemene-voorwaarden", "yearly", 0.4],
    ["cookie-beleid", "yearly", 0.4],
    ["login", "monthly", 0.5],
    ["register", "monthly", 0.5],
  ];

  const staticPages: MetadataRoute.Sitemap = staticEntries.flatMap(([path, changeFrequency, priority]) =>
    entry(path, { changeFrequency, priority })
  );

  const functiePages: MetadataRoute.Sitemap = FUNCTIE_SLUGS.flatMap((slug) => {
    const enSlug = featureSlugMap[slug] ?? slug;
    const now = new Date();
    const opts = { lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 };
    return [
      { url: url(`functies/${slug}`), ...opts },
      { url: url(`en/functions/${enSlug}`), ...opts },
    ];
  });

  const now = new Date();
  const blogOpts = { lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 };
  const blogPagesNl: MetadataRoute.Sitemap = getPostSlugs("nl").map((slug) => ({
    url: url(`blog/${slug}`),
    ...blogOpts,
  }));
  const blogPagesEn: MetadataRoute.Sitemap = getPostSlugs("en").map((slug) => ({
    url: url(`en/blog/${slug}`),
    ...blogOpts,
  }));
  const blogPages: MetadataRoute.Sitemap = [...blogPagesNl, ...blogPagesEn];

  return [...staticPages, ...functiePages, ...blogPages];
}
