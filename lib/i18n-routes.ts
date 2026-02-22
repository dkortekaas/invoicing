import type { Locale } from "./i18n";

/**
 * Route mapping between NL (default) and EN locales.
 * NL paths are the actual Next.js routes; EN paths are rewritten by middleware.
 */

// Static route segments: NL path segment → EN path segment
const segmentMap: Record<string, string> = {
  functies: "functions",
  prijzen: "pricing",
  contact: "contact",
  help: "help",
  nieuwsbrief: "newsletter",
  blog: "blog",
};

// Reverse: EN → NL
const reverseSegmentMap: Record<string, string> = Object.fromEntries(
  Object.entries(segmentMap).map(([nl, en]) => [en, nl])
);

// Feature detail slugs: NL → EN
export const featureSlugMap: Record<string, string> = {
  "facturen-en-offertes": "invoices-and-quotes",
  betalingen: "payments",
  "onkosten-en-bonnetjes": "expenses-and-receipts",
  "projecten-en-uren": "projects-and-hours",
  "rapportages-en-belasting": "reports-and-taxes",
  koppelingen: "integrations",
};

// Reverse: EN → NL feature slugs
export const reverseFeatureSlugMap: Record<string, string> = Object.fromEntries(
  Object.entries(featureSlugMap).map(([nl, en]) => [en, nl])
);

/**
 * All EN static paths the middleware should match (without /en prefix).
 * Maps EN path → NL internal path.
 */
export function getEnToNlPathMap(): Record<string, string> {
  const map: Record<string, string> = {
    // Homepage
    "/en": "/",
    // Static pages
    "/en/functions": "/functies",
    "/en/pricing": "/prijzen",
    "/en/contact": "/contact",
    "/en/help": "/help",
    "/en/newsletter": "/nieuwsbrief",
    "/en/blog": "/blog",
  };

  // Feature detail pages
  for (const [nlSlug, enSlug] of Object.entries(featureSlugMap)) {
    map[`/en/functions/${enSlug}`] = `/functies/${nlSlug}`;
  }

  return map;
}

/**
 * Convert an NL path to the equivalent EN path.
 */
export function nlPathToEn(nlPath: string): string {
  // Homepage
  if (nlPath === "/" || nlPath === "") return "/en";

  // Feature detail: /functies/[slug]
  const featureMatch = nlPath.match(/^\/functies\/(.+)$/);
  if (featureMatch && featureMatch[1]) {
    const nlSlug = featureMatch[1];
    const enSlug = featureSlugMap[nlSlug] ?? nlSlug;
    return `/en/functions/${enSlug}`;
  }

  // Blog detail: /blog/[slug] - slug stays the same for NL, but EN has its own slugs
  // This is handled separately (needs blog content lookup)

  // Static pages
  const segments = nlPath.split("/").filter(Boolean);
  const first = segments[0];
  if (first && segmentMap[first]) {
    segments[0] = segmentMap[first];
  }
  return `/en/${segments.join("/")}`;
}

/**
 * Convert an EN path to the equivalent NL internal path.
 */
export function enPathToNl(enPath: string): string {
  // Strip /en prefix
  const withoutPrefix = enPath.replace(/^\/en\/?/, "/").replace(/^\/$/, "/");

  if (withoutPrefix === "/") return "/";

  const segments = withoutPrefix.split("/").filter(Boolean);

  // Map first segment back to NL
  const first = segments[0];
  if (first && reverseSegmentMap[first]) {
    segments[0] = reverseSegmentMap[first];
  }

  // Map feature slug if under functions → functies
  const second = segments[1];
  if (segments[0] === "functies" && second) {
    if (reverseFeatureSlugMap[second]) {
      segments[1] = reverseFeatureSlugMap[second];
    }
  }

  return `/${segments.join("/")}`;
}

/**
 * Get the path for a given locale. Used by components to generate locale-aware links.
 * `basePath` is always the NL path (e.g. "/functies", "/blog").
 */
export function localePath(basePath: string, locale: Locale): string {
  if (locale === "nl") return basePath;
  return nlPathToEn(basePath);
}

/**
 * Detect locale from a pathname. Returns "en" if path starts with /en/, else "nl".
 */
export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "nl";
}

/**
 * Check if a pathname is a marketing route (not auth/app).
 */
const marketingPrefixes = [
  "/functies",
  "/prijzen",
  "/contact",
  "/help",
  "/nieuwsbrief",
  "/blog",
  "/privacy",
  "/algemene-voorwaarden",
  "/cookie-beleid",
  "/en",
];

export function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return marketingPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
