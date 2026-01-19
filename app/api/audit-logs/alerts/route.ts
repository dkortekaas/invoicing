import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireAdmin, isSuperuser } from "@/lib/auth/admin-guard"

export async function GET(request: NextRequest) {
  try {
    // Alleen ADMIN en SUPERUSER hebben toegang
    await requireAdmin()
    
    // Check if user is superuser for global access, otherwise only own logs
    const currentUserId = await getCurrentUserId()
    const userIsSuperuser = await isSuperuser(currentUserId)
    
    let userId: string | undefined
    if (!userIsSuperuser) {
      // ADMIN ziet alleen eigen alerts
      userId = currentUserId
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
    
    if (userId) {
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
          count: groupedAlerts[reason]?.length || 0,
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
