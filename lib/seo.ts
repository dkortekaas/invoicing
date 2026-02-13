import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://declair.app";
const BASE = SITE_URL.replace(/\/$/, "");

/**
 * Full URL for a path (path should start with / or be empty for homepage).
 */
export function fullUrl(path: string): string {
  if (!path || path === "/") return BASE;
  return `${BASE}/${path.replace(/^\//, "")}`;
}

/**
 * Metadata alternates (canonical + hreflang nl) for a given path.
 * Use in layout or page metadata for correct canonical URLs and Dutch hreflang.
 */
export function alternatesForPath(path: string): Metadata["alternates"] {
  const url = fullUrl(path);
  return {
    canonical: url,
    languages: {
      "nl": url,
      "x-default": url,
    },
  };
}

export { BASE as siteUrl };
