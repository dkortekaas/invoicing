import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const userId = await getCurrentUserId()
    const { type, id } = params
    
    // Get all audit logs for this entity
    const logs = await db.auditLog.findMany({
      where: {
        entityType: type,
        entityId: id,
        // Only show logs for entities owned by the user (unless superuser)
        OR: [
          { userId },
          { userId: null }, // System logs
        ],
      },
      orderBy: { timestamp: "asc" },
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
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching entity audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch entity audit logs" },
      { status: 500 }
    )
  }
}
