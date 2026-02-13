/**
 * Analytics helpers for GA4. Only fire when gtag is loaded (and user has
 * accepted analytics cookies, which is required for gtag to load).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track a successful form submission. Use for contact, newsletter, etc.
 * GA4 recommended: use event 'generate_lead' for lead-gen forms.
 */
export function trackFormSuccess(formName: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "generate_lead", {
    form_name: formName,
  });
}

/**
 * Track sign-up (e.g. register).
 */
export function trackSignUp(method?: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "sign_up", { method: method ?? "email" });
}

/**
 * Track login.
 */
export function trackLogin(method?: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "login", { method: method ?? "credentials" });
}
