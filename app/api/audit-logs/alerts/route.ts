import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireSuperuser } from "@/lib/auth/admin-guard"

export async function GET(request: NextRequest) {
  try {
    // Only superusers can see all alerts, regular users see only their own
    let userId: string | undefined
    let isSuperuser = false
    
    try {
      await requireSuperuser()
      isSuperuser = true
    } catch {
      userId = await getCurrentUserId()
    }
    
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "7")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const where: any = {
      isSuspicious: true,
      timestamp: {
        gte: startDate,
      },
    }
    
    if (userId && !isSuperuser) {
      where.userId = userId
    }
    
    const alerts = await db.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })
    
    // Group alerts by type
    const groupedAlerts = alerts.reduce((acc, alert) => {
      const reason = alert.suspiciousReason || "Unknown"
      if (!acc[reason]) {
        acc[reason] = []
      }
      acc[reason].push(alert)
      return acc
    }, {} as Record<string, typeof alerts>)
    
    return NextResponse.json({
      alerts,
      groupedAlerts,
      summary: {
        total: alerts.length,
        byReason: Object.keys(groupedAlerts).map((reason) => ({
          reason,
          count: groupedAlerts[reason].length,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching audit alerts:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit alerts" },
      { status: 500 }
    )
  }
}
