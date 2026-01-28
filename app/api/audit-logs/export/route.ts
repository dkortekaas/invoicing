import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireAdmin, isSuperuser } from "@/lib/auth/admin-guard"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    // Alleen ADMIN en SUPERUSER hebben toegang
    await requireAdmin()
    
    // Check if user is superuser for global access, otherwise only own logs
    const currentUserId = await getCurrentUserId()
    const userIsSuperuser = await isSuperuser(currentUserId)
    
    let userId: string | undefined
    if (!userIsSuperuser) {
      // ADMIN kan alleen eigen logs exporteren
      userId = currentUserId
    }
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    const where: Prisma.AuditLogWhereInput = {}
    
    if (userId) {
      where.userId = userId
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
    
    const logs = await db.auditLog.findMany({
      where,
      orderBy: { timestamp: "asc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })
    
    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Timestamp",
        "User Email",
        "User Name",
        "Action",
        "Entity Type",
        "Entity ID",
        "IP Address",
        "User Agent",
        "Suspicious",
        "Suspicious Reason",
        "Changes",
        "Metadata",
      ]
      
      const rows = logs.map((log) => [
        log.timestamp.toISOString(),
        log.userEmail,
        log.user?.name || "",
        log.action,
        log.entityType,
        log.entityId || "",
        log.ipAddress || "",
        log.userAgent || "",
        log.isSuspicious ? "Yes" : "No",
        log.suspiciousReason || "",
        JSON.stringify(log.changes),
        JSON.stringify(log.metadata),
      ])
      
      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n")
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else {
      // JSON format
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalRecords: logs.length,
        logs: logs.map((log) => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          userEmail: log.userEmail,
          userName: log.user?.name,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          changes: log.changes,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          isSuspicious: log.isSuspicious,
          suspiciousReason: log.suspiciousReason,
          hash: log.hash,
          previousHash: log.previousHash,
        })),
      })
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error)
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    )
  }
}
