import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireAdmin, isSuperuser } from "@/lib/auth/admin-guard"
import { Prisma, AuditAction } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Alleen ADMIN en SUPERUSER hebben toegang
    await requireAdmin()
    
    // Check if user is superuser for global access, otherwise only own logs
    const currentUserId = await getCurrentUserId()
    const userIsSuperuser = await isSuperuser(currentUserId)
    
    let userId: string | undefined
    if (!userIsSuperuser) {
      // ADMIN ziet alleen eigen logs
      userId = currentUserId
    }
    // SUPERUSER ziet alle logs (userId blijft undefined)
    
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
    const where: Prisma.AuditLogWhereInput = {}
    
    if (userId) {
      // ADMIN ziet alleen eigen logs
      where.userId = userId
    }
    // SUPERUSER ziet alle logs (geen userId filter)
    
    if (action) {
      // Validate that action is a valid AuditAction enum value
      if (Object.values(AuditAction).includes(action as AuditAction)) {
        where.action = action as AuditAction
      }
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
