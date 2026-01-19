import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { db } from "@/lib/db"

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = request.nextUrl

  // Allow access to auth pages and API routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Require authentication for all other pages
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check premium routes
  const premiumRoutes = [
    '/abonnementen',
    '/btw',
    '/tijd',
    '/dashboard',
    '/rapporten',
  ]

  const requiresPremium = premiumRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (requiresPremium && token.id) {
    try {
      const user = await db.user.findUnique({
        where: { id: token.id as string },
        select: {
          role: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          stripeCurrentPeriodEnd: true,
        },
      })

      if (user) {
        // Superusers have access to everything, skip subscription check
        if (user.role === 'SUPERUSER') {
          return NextResponse.next()
        }

        const isPro = user.subscriptionTier === 'PRO'
        const isActive = ['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus)
        const notExpired = user.stripeCurrentPeriodEnd
          ? new Date(user.stripeCurrentPeriodEnd) > new Date()
          : false

        if (!isPro || !isActive || !notExpired) {
          const feature = pathname.split('/')[1]
          return NextResponse.redirect(
            new URL(`/upgrade?feature=${feature}`, request.url)
          )
        }
      }
    } catch (error) {
      // If database check fails, allow access (fail open)
      console.error('Premium route check failed:', error)
    }
  }

  return NextResponse.next()
}

// Config is optional in Next.js 16 proxy.ts
// The proxy function will be called for all routes by default
// You can add early returns in the function itself to skip certain paths
