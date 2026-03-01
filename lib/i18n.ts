import type nlMessages from "@/messages/nl.json";
import nlMessagesData from "@/messages/nl.json";
import enMessagesData from "@/messages/en.json";

export type Locale = "nl" | "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const locales: Locale[] = ["nl", "en"];
export const defaultLocale: Locale = "nl";

export const localeNames: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
};

export type Messages = typeof nlMessages;

const messagesByLocale: Record<Locale, Messages> = {
  nl: nlMessagesData as Messages,
  en: enMessagesData as unknown as Messages,
};

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}

/** Get nested value by path like "header.features" or "footer.links.privacy" */
function getNested(obj: Record<string, unknown>, path: string): string | Record<string, unknown> | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current as string | Record<string, unknown> | undefined;
}

/** Create a t() function for a given messages object and optional namespace (e.g. "header"). */
export function createT(messages: Messages, namespace?: keyof Messages) {
  const base = namespace
    ? (messages[namespace] as Record<string, unknown>)
    : (messages as unknown as Record<string, unknown>);

  return function t(key: string): string {
    const value = getNested(base, key);
    if (typeof value === "string") return value;
    return key;
  };
}

export { getNested };

/**
 * Get locale from x-locale header (set by middleware for /en/* paths).
 * For use in server components.
 */
export async function getLocaleFromHeaders(): Promise<Locale> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const xLocale = headersList.get("x-locale");
  if (xLocale === "en") return "en";
  return defaultLocale;
}

/**
 * Get locale for server components in the app (authenticated) area.
 * Reads from x-locale header first (set by middleware for /en/* paths),
 * then falls back to the NEXT_LOCALE cookie.
 */
export async function getAppLocale(): Promise<Locale> {
  const [{ headers }, { cookies }] = await Promise.all([
    import("next/headers"),
    import("next/headers"),
  ]);
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);
  const xLocale = headersList.get("x-locale");
  if (xLocale === "en") return "en";
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "en") return "en";
  return defaultLocale;
}

/**
 * Get a t() function for a given namespace in server components.
 * Usage: const t = await getServerT("invoicesPage")
 */
export async function getServerT(namespace: keyof Messages) {
  const locale = await getAppLocale();
  const messages = getMessages(locale);
  return createT(messages, namespace);
}
