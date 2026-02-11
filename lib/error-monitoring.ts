/**
 * Error monitoring abstraction layer.
 *
 * Logs errors to console by default. When Sentry is installed and configured,
 * automatically forwards errors to Sentry.
 *
 * To enable Sentry:
 *   1. npx @sentry/wizard@latest -i nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN and SENTRY_AUTH_TOKEN env vars
 *   3. Errors will be automatically forwarded to Sentry
 */

interface ErrorContext {
  /** Additional data to attach to the error report */
  extra?: Record<string, unknown>
  /** User information */
  user?: { id?: string; email?: string }
  /** Tags for filtering in error monitoring dashboard */
  tags?: Record<string, string>
  /** Severity level */
  level?: "fatal" | "error" | "warning" | "info"
}

let sentryModule: typeof import("@sentry/nextjs") | null = null
let sentryInitAttempted = false

async function getSentry() {
  if (sentryInitAttempted) return sentryModule
  sentryInitAttempted = true

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null

  try {
    sentryModule = await import("@sentry/nextjs")
    return sentryModule
  } catch {
    // @sentry/nextjs not installed
    return null
  }
}

/**
 * Report an error to the monitoring system.
 */
export async function captureException(
  error: Error | unknown,
  context?: ErrorContext
): Promise<void> {
  // Always log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Monitor]", error, context?.extra)
  }

  const sentry = await getSentry()
  if (sentry) {
    sentry.withScope((scope) => {
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      if (context?.user) {
        scope.setUser(context.user)
      }
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }
      if (context?.level) {
        scope.setLevel(context.level)
      }
      sentry.captureException(error)
    })
  }
}

/**
 * Log a message to the monitoring system.
 */
export async function captureMessage(
  message: string,
  context?: ErrorContext
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[Error Monitor]", message, context?.extra)
  }

  const sentry = await getSentry()
  if (sentry) {
    sentry.withScope((scope) => {
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      if (context?.level) {
        scope.setLevel(context.level)
      }
      sentry.captureMessage(message)
    })
  }
}
