"use client"

import type { Messages } from "@/lib/i18n"
import { useLocale } from "@/components/providers/locale-provider"

interface TProps {
  ns: keyof Messages
  k: string
  vars?: Record<string, string>
}

/**
 * Client-side translation component. Renders translated text instantly when
 * locale changes — no server refresh required. Use inside server components
 * to get instant language switching for visible text.
 *
 * @example
 * // Simple
 * <T ns="invoicesPage" k="title" />
 *
 * // With variable substitution
 * <T ns="invoicesPage" k="vatLine" vars={{ rate: "21", amount: "€ 100,00" }} />
 */
export function T({ ns, k, vars }: TProps) {
  const { t } = useLocale()
  let text = t(ns, k)
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.replace(`{${key}}`, value)
    }
  }
  return <>{text}</>
}
