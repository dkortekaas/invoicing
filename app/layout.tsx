import type { Metadata, Viewport } from "next"
import { cookies, headers } from "next/headers"
import localFont from "next/font/local"
import "./globals.css"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner"
import { AnalyticsClickTracking } from "@/components/marketing/analytics-click-tracking"
import { GoogleAnalytics } from "@/components/marketing/google-analytics"
import { PageViewTracker } from "@/components/marketing/page-view-tracker"
import { AuthProvider } from "@/components/providers/session-provider"
import { LocaleProvider } from "@/components/providers/locale-provider"
import { Toaster } from "@/components/ui/sonner"
import { type Locale, defaultLocale, LOCALE_COOKIE } from "@/lib/i18n"

const inter = localFont({
  src: [
    { path: "../public/fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "Declair",
    template: "%s | Declair",
  },
  description: "Jouw administratie. Helder geregeld.",
  formatDetection: {
    telephone: false,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()])
  // x-locale header is set by middleware for /en/* routes
  const xLocale = headersList.get("x-locale") as Locale | null
  const locale = xLocale ?? (cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined) ?? defaultLocale

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="declair" />
        <link rel="manifest" href="/favicons/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <PageViewTracker />
        <AnalyticsClickTracking />
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </AuthProvider>
        </LocaleProvider>
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  )
}
