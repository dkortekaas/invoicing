"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_EVENT,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const show = !stored;
    queueMicrotask(() => {
      setMounted(true);
      if (show) setVisible(true);
    });
  }, []);

  const saveConsent = (value: CookieConsentValue) => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    setVisible(false);
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_EVENT, { detail: { consent: value } })
    );
  };

  if (!mounted || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="container mx-auto px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <p className="text-sm text-muted-foreground md:max-w-2xl">
              We gebruiken cookies om je ervaring te verbeteren en ons verkeer te
              analyseren. Lees ons{" "}
              <Link
                href="/cookie-beleid"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                cookiebeleid
              </Link>
              .
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveConsent("essential")}
                className="border-border"
              >
                Alleen noodzakelijk
              </Button>
              <Button size="sm" onClick={() => saveConsent("accepted")}>
                Accepteren
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
