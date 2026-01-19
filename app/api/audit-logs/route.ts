import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireSuperuser } from "@/lib/auth/admin-guard"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if user is superuser for global access, otherwise only own logs
    let userId: string | undefined
    let isSuperuser = false
    
    try {
      await requireSuperuser()
      isSuperuser = true
    } catch {
      // Not superuser, get own logs only
      userId = await getCurrentUserId()
    }
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit
    
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const userEmail = searchParams.get("userEmail")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const suspiciousOnly = searchParams.get("suspiciousOnly") === "true"
    
    // Build where clause
    const where: any = {}
    
    if (userId && !isSuperuser) {
      where.userId = userId
    }
    
    if (action) {
      where.action = action
    }
    
    if (entityType) {
      where.entityType = entityType
    }
    
    if (entityId) {
      where.entityId = entityId
    }
    
    if (userEmail) {
      where.userEmail = { contains: userEmail, mode: "insensitive" }
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }
    
    if (suspiciousOnly) {
      where.isSuspicious = true
    }
    
    // Get logs with pagination
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
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
      }),
      db.auditLog.count({ where }),
    ])
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
