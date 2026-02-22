"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import nlMessages from "@/messages/nl.json";
import enMessages from "@/messages/en.json";
import {
  type Locale,
  type Messages,
  LOCALE_COOKIE,
  defaultLocale,
  createT,
} from "@/lib/i18n";
import { localePath, localeFromPathname, isMarketingPath } from "@/lib/i18n-routes";

const messagesMap: Record<Locale, Messages> = {
  nl: nlMessages as Messages,
  en: enMessages as unknown as Messages,
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (namespace: keyof Messages, key: string) => string;
  /** Generate a locale-aware path. Pass the NL base path (e.g. "/functies"). */
  lp: (basePath: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  if (value === "nl" || value === "en") return value;
  return defaultLocale;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // For marketing pages derive locale from URL; for app pages use cookie
  const derivedLocale = isMarketingPath(pathname)
    ? localeFromPathname(pathname)
    : initialLocale;
  const [locale, setLocaleState] = useState<Locale>(derivedLocale);

  // Sync locale when pathname changes (marketing) or cookie changes (app)
  useEffect(() => {
    if (isMarketingPath(pathname)) {
      const pathLocale = localeFromPathname(pathname);
      if (pathLocale !== locale) {
        // Use startTransition to avoid cascading render warning
        React.startTransition(() => setLocaleState(pathLocale));
      }
    } else {
      queueMicrotask(() => {
        const cookieLocale = getLocaleFromCookie();
        if (cookieLocale !== locale) setLocaleState(cookieLocale);
      });
    }
  }, [pathname, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;
      setLocaleCookie(newLocale);
      setLocaleState(newLocale);
      // Defer refresh so client components re-render first with the new locale
      setTimeout(() => router.refresh(), 0);
    },
    [locale, router]
  );

  const t = useCallback(
    (namespace: keyof Messages, key: string): string => {
      const messages = messagesMap[locale];
      const createTForNamespace = createT(messages, namespace);
      return createTForNamespace(key);
    },
    [locale]
  );

  const lp = useCallback(
    (basePath: string): string => localePath(basePath, locale),
    [locale]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t, lp }),
    [locale, setLocale, t, lp]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslations(namespace: keyof Messages) {
  const { t, locale, lp } = useLocale();
  const tNs = useCallback((key: string) => t(namespace, key), [t, namespace]);
  return { t: tNs, locale, lp };
}
