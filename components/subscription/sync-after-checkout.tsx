"use client"

import { useEffect } from "react"

/**
 * Call sync API when user lands on checkout success so subscription tier is updated
 * even if the Stripe webhook was missed (e.g. local dev without stripe listen).
 */
export function SyncAfterCheckout() {
  useEffect(() => {
    fetch("/api/stripe/sync", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.synced) {
          // Optional: trigger a soft refresh so nav/UI shows new tier
          window.dispatchEvent(new CustomEvent("subscription-synced"))
        }
      })
      .catch(() => {})
  }, [])
  return null
}
