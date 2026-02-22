import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { db } from "@/lib/db"
import { getEnToNlPathMap } from "@/lib/i18n-routes"

function rewriteToNl(request: NextRequest, nlPath: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = nlPath

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-locale", "en")

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle /en/* paths: rewrite to NL equivalent and set locale header
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const staticMap = getEnToNlPathMap()

    // Check static path map first (exact match)
    if (staticMap[pathname]) {
      return rewriteToNl(request, staticMap[pathname])
    }

    // Dynamic: /en/blog/[slug] → /blog/[slug] (slug passed through as-is)
    const blogMatch = pathname.match(/^\/en\/blog\/(.+)$/)
    if (blogMatch) {
      return rewriteToNl(request, `/blog/${blogMatch[1]}`)
    }

    // Dynamic: /en/functions/[slug] → /functies/[slug] (fallback for unknown slugs)
    const functionsMatch = pathname.match(/^\/en\/functions\/(.+)$/)
    if (functionsMatch) {
      return rewriteToNl(request, `/functies/${functionsMatch[1]}`)
    }

    // Fallback: strip /en prefix
    const stripped = pathname.replace(/^\/en\/?/, "/") || "/"
    return rewriteToNl(request, stripped)
  }

  // Get JWT token from cookie
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

  // Determine if we're on HTTPS (production)
  const isSecure = request.url.startsWith('https://')

  // NextAuth v5 (Auth.js) uses different cookie names than v4
  // In production (HTTPS): __Secure-authjs.session-token
  // In development (HTTP): authjs.session-token
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

  const token = await getToken({
    req: request,
    secret,
    cookieName,
  })

  // Allow access to auth pages, marketing pages, legal pages, payment pages, and API routes
  if (
    pathname === "/" ||
    pathname === "/prijzen" ||
    pathname === "/privacy" ||
    pathname === "/cookie-beleid" ||
    pathname === "/algemene-voorwaarden" ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/functies") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/nieuwsbrief") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/uitnodiging") ||
    pathname.startsWith("/pay") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/mollie/webhook") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Known protected app routes that require authentication
  const protectedRoutePrefixes = [
    "/dashboard",
    "/facturen",
    "/klanten",
    "/producten",
    "/kosten",
    "/abonnementen",
    "/abonnement",
    "/btw",
    "/belasting",
    "/tijd",
    "/activa",
    "/admin",
    "/instellingen",
    "/creditnotas",
    "/upgrade",
    "/audit-logs",
  ]
  const isProtectedRoute = protectedRoutePrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  // Only require auth for known protected routes; unknown paths get 404
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check premium routes and company details in a single consolidated query
  const premiumRoutes = [
    '/abonnementen',
    '/btw',
    '/tijd',
    '/rapporten',
  ]

  const requiresPremium = premiumRoutes.some(route =>
    pathname.startsWith(route)
  )

  const needsCompanyCheck = !pathname.startsWith('/api') && !pathname.startsWith('/instellingen')

  if (token?.id && (requiresPremium || needsCompanyCheck)) {
    try {
      // Single DB query for both premium and company details checks
      const user = await db.user.findUnique({
        where: { id: token.id as string },
        select: {
          role: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          stripeCurrentPeriodEnd: true,
          isManualSubscription: true,
          manualSubscriptionExpiresAt: true,
          ...(needsCompanyCheck && {
            company: {
              select: {
                name: true,
                email: true,
                address: true,
                city: true,
                postalCode: true,
              },
            },
          }),
        },
      })

      // Premium route check
      if (requiresPremium && user) {
        if (user.role !== 'SUPERUSER') {
          const tier = user.subscriptionTier
          const isPaid = ['STARTER', 'PROFESSIONAL', 'BUSINESS'].includes(tier)

          let isActiveSubscription = false
          if (isPaid) {
            if (user.isManualSubscription) {
              isActiveSubscription = !user.manualSubscriptionExpiresAt ||
                new Date(user.manualSubscriptionExpiresAt) > new Date()
            } else {
              const isActive = ['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus)
              const notExpired = user.stripeCurrentPeriodEnd
                ? new Date(user.stripeCurrentPeriodEnd) > new Date()
                : false
              isActiveSubscription = isActive && notExpired
            }
          }

          if (!isActiveSubscription) {
            const feature = pathname.split('/')[1]
            return NextResponse.redirect(
              new URL(`/upgrade?feature=${feature}`, request.url)
            )
          }
        }
      }

      // Company details check
      if (needsCompanyCheck && user && 'company' in user) {
        const { hasCompanyDetails } = await import('@/lib/company-guard')
        if (!hasCompanyDetails(user.company)) {
          return NextResponse.redirect(new URL('/instellingen?tab=bedrijfsgegevens', request.url))
        }
      }
    } catch (error) {
      // Fail-closed: deny access to premium routes on database errors
      if (requiresPremium) {
        console.error('Premium route check failed (denying access):', error)
        const feature = pathname.split('/')[1]
        return NextResponse.redirect(
          new URL(`/upgrade?feature=${feature}`, request.url)
        )
      }
      // Company details check failure is non-critical, allow through
      console.error('Company details check failed:', error)
    }
  }

  return NextResponse.next()
}

// Config is optional in Next.js 16 proxy.ts
// The proxy function will be called for all routes by default
// You can add early returns in the function itself to skip certain paths
