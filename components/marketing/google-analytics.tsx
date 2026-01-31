"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_EVENT,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const checkConsent = () => {
      const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) as
        | CookieConsentValue
        | null;
      if (stored === "accepted") setShouldLoad(true);
    };

    checkConsent();

    const handleConsentUpdate = (e: CustomEvent<{ consent: CookieConsentValue }>) => {
      if (e.detail?.consent === "accepted") setShouldLoad(true);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentUpdate as EventListener);
    return () =>
      window.removeEventListener(
        COOKIE_CONSENT_EVENT,
        handleConsentUpdate as EventListener
      );
  }, []);

  if (!GA_MEASUREMENT_ID || !shouldLoad) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
