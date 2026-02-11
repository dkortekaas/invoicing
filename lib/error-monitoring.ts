/**
 * Error monitoring abstraction layer.
 *
 * Logs errors to console by default. To enable Sentry:
 *   1. npx @sentry/wizard@latest -i nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN and SENTRY_AUTH_TOKEN env vars
 *   3. Uncomment the Sentry import below and the forwarding code
 *
 * The wizard will create sentry.client.config.ts, sentry.server.config.ts,
 * and sentry.edge.config.ts which auto-capture errors. This module provides
 * additional structured error reporting for custom error handling.
 */

// Uncomment after installing @sentry/nextjs:
// import * as Sentry from "@sentry/nextjs"

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

/**
 * Report an error to the monitoring system.
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext
): void {
  // Always log to console
  console.error(
    "[Error Monitor]",
    context?.tags ? `[${Object.values(context.tags).join(":")}]` : "",
    error,
    context?.extra || ""
  )

  // Uncomment after installing @sentry/nextjs:
  // Sentry.withScope((scope) => {
  //   if (context?.extra) {
  //     Object.entries(context.extra).forEach(([key, value]) => {
  //       scope.setExtra(key, value)
  //     })
  //   }
  //   if (context?.user) scope.setUser(context.user)
  //   if (context?.tags) {
  //     Object.entries(context.tags).forEach(([key, value]) => {
  //       scope.setTag(key, value)
  //     })
  //   }
  //   if (context?.level) scope.setLevel(context.level)
  //   Sentry.captureException(error)
  // })
}

/**
 * Log a message to the monitoring system.
 */
export function captureMessage(
  message: string,
  context?: ErrorContext
): void {
  console.log(
    "[Error Monitor]",
    context?.tags ? `[${Object.values(context.tags).join(":")}]` : "",
    message,
    context?.extra || ""
  )

  // Uncomment after installing @sentry/nextjs:
  // Sentry.withScope((scope) => {
  //   if (context?.extra) {
  //     Object.entries(context.extra).forEach(([key, value]) => {
  //       scope.setExtra(key, value)
  //     })
  //   }
  //   if (context?.level) scope.setLevel(context.level)
  //   Sentry.captureMessage(message)
  // })
}
