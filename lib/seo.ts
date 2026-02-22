import type { Metadata } from "next";
import type { Locale } from "./i18n";
import { nlPathToEn } from "./i18n-routes";

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
 * Metadata alternates with hreflang for both NL and EN.
 * `nlPath` is the NL path (e.g. "blog", "functies/facturen-en-offertes").
 * `enPath` is optional; if not provided, it's auto-generated from the NL path.
 * `locale` determines the canonical URL.
 */
export function alternatesForPath(
  nlPath: string,
  locale: Locale = "nl",
  enPath?: string
): Metadata["alternates"] {
  const nlFullPath = nlPath.startsWith("/") ? nlPath : nlPath === "" ? "/" : `/${nlPath}`;
  const enFullPath = enPath
    ? enPath.startsWith("/") ? enPath : `/${enPath}`
    : nlPathToEn(nlFullPath);

  const nlUrl = fullUrl(nlFullPath);
  const enUrl = fullUrl(enFullPath);
  const canonicalUrl = locale === "nl" ? nlUrl : enUrl;

  return {
    canonical: canonicalUrl,
    languages: {
      nl: nlUrl,
      en: enUrl,
      "x-default": nlUrl,
    },
  };
}

export { BASE as siteUrl };
