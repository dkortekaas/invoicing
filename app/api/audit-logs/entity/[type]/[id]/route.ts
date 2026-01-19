import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireAdmin, isSuperuser } from "@/lib/auth/admin-guard"

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    // Alleen ADMIN en SUPERUSER hebben toegang
    await requireAdmin()
    
    const currentUserId = await getCurrentUserId()
    const userIsSuperuser = await isSuperuser(currentUserId)
    const { type, id } = params
    
    // Build where clause
    const where: any = {
      entityType: type,
      entityId: id,
    }
    
    // Alleen SUPERUSER kan alle logs zien, ADMIN alleen eigen logs
    if (!userIsSuperuser) {
      where.OR = [
        { userId: currentUserId },
        { userId: null }, // System logs
      ]
    }
    
    // Get all audit logs for this entity
    const logs = await db.auditLog.findMany({
      where,
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
