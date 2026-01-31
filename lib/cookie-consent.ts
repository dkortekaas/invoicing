/**
 * Shared constants for cookie consent. Used by the consent banner
 * and by Google Analytics (and other analytics) to respect the user's choice.
 */
export const COOKIE_CONSENT_STORAGE_KEY = "declair-cookie-consent";

export type CookieConsentValue = "accepted" | "essential";

export const COOKIE_CONSENT_EVENT = "declair-cookie-consent-updated";

declare global {
  interface WindowEventMap {
    [COOKIE_CONSENT_EVENT]: CustomEvent<{ consent: CookieConsentValue }>;
  }
}
