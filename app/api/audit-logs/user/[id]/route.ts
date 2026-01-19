import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireSuperuser } from "@/lib/auth/admin-guard"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = await getCurrentUserId()
    const { id } = params
    
    // Users can only see their own logs unless they're superuser
    let targetUserId = id
    try {
      await requireSuperuser()
    } catch {
      // Not superuser, only allow viewing own logs
      if (id !== currentUserId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        )
      }
      targetUserId = currentUserId
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit
    
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where: {
          userId: targetUserId,
        },
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
      db.auditLog.count({
        where: {
          userId: targetUserId,
        },
      }),
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
    console.error("Error fetching user audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch user audit logs" },
      { status: 500 }
    )
  }
}
