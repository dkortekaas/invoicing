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
