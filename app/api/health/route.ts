import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Never cache the health response — monitoring tools need a live check each time
export const dynamic = "force-dynamic"

/**
 * GET /api/health
 *
 * Lightweight liveness + DB-readiness check for uptime monitors
 * (Vercel, Better Uptime, UptimeRobot, etc.).
 *
 * Returns 200 { status: "ok", db: "ok", timestamp } when healthy.
 * Returns 503 { status: "error", db: "error", timestamp } when the DB is unreachable.
 */
export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok", db: "ok", timestamp })
  } catch {
    return NextResponse.json(
      { status: "error", db: "error", timestamp },
      { status: 503 }
    )
  }
}
