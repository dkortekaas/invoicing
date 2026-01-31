"use client";

import { useEffect, useState } from "react";
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

function getClickTarget(element: EventTarget | null): {
  type: "link" | "button";
  url?: string;
  text: string;
} | null {
  if (!element || !(element instanceof HTMLElement)) return null;
  const link = element.closest("a");
  if (link) {
    return {
      type: "link",
      url: link.href || undefined,
      text:
        link.getAttribute("aria-label") ||
        link.textContent?.trim().slice(0, 100) ||
        "link",
    };
  }
  const button = element.closest("button");
  if (button) {
    return {
      type: "button",
      text:
        button.getAttribute("aria-label") ||
        button.textContent?.trim().slice(0, 100) ||
        "button",
    };
  }
  return null;
}

export function AnalyticsClickTracking() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) as
        | CookieConsentValue
        | null;
      if (stored === "accepted") setHasConsent(true);
    };

    checkConsent();

    const handleConsentUpdate = (e: CustomEvent<{ consent: CookieConsentValue }>) => {
      if (e.detail?.consent === "accepted") setHasConsent(true);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentUpdate as EventListener);
    return () =>
      window.removeEventListener(
        COOKIE_CONSENT_EVENT,
        handleConsentUpdate as EventListener
      );
  }, []);

  useEffect(() => {
    if (!hasConsent) return;

    const handleClick = (e: MouseEvent) => {
      const target = getClickTarget(e.target);
      if (!target) return;
      if (typeof window.gtag !== "function") return;

      window.gtag("event", "click", {
        event_category: "engagement",
        event_label: target.text,
        link_url: target.url,
        element_type: target.type,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasConsent]);

  return null;
}
