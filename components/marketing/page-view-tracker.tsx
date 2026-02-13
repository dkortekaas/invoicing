"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_EVENT,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a GA4 page_view event on client-side route changes (Next.js App Router).
 * Initial page load is already tracked by gtag('config', ...). Only runs when
 * the user has accepted analytics cookies.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const hasConsentRef = useRef(false);

  useEffect(() => {
    const checkConsent = () => {
      const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) as
        | CookieConsentValue
        | null;
      hasConsentRef.current = stored === "accepted";
    };
    checkConsent();
    const handleConsent = (e: CustomEvent<{ consent: CookieConsentValue }>) => {
      if (e.detail?.consent === "accepted") hasConsentRef.current = true;
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsent as EventListener);
    return () =>
      window.removeEventListener(
        COOKIE_CONSENT_EVENT,
        handleConsent as EventListener
      );
  }, []);

  useEffect(() => {
    if (!hasConsentRef.current || typeof window.gtag !== "function") return;
    // Only send on route change, not on initial mount (config already sends first page_view)
    if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
      window.gtag("event", "page_view", {
        page_path: pathname ?? window.location.pathname,
        page_title: document.title,
      });
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  return null;
}
