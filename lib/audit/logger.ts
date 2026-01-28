"use server"

import { db } from "@/lib/db"
import { createHash } from "crypto"
import { headers } from "next/headers"
import type { AuditAction } from "@prisma/client"

export interface AuditLogData {
  userId?: string
  userEmail: string
  action: AuditAction
  entityType: string
  entityId?: string
  changes?: Record<string, { oldValue: unknown; newValue: unknown }>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

/**
 * Calculate hash for an audit log entry
 */
function calculateHash(data: {
  timestamp: Date
  userId: string | null
  userEmail: string
  action: string
  entityType: string
  entityId: string | null
  changes: Record<string, { oldValue: unknown; newValue: unknown }> | null
  previousHash: string | null
}): string {
  const hashInput = JSON.stringify({
    timestamp: data.timestamp.toISOString(),
    userId: data.userId,
    userEmail: data.userEmail,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    changes: data.changes,
    previousHash: data.previousHash,
  })
  
  return createHash("sha256").update(hashInput).digest("hex")
}

/**
 * Get the hash of the last audit log entry for chain integrity
 */
async function getPreviousHash(userId?: string): Promise<string | null> {
  const where = userId ? { userId } : {}
  
  const lastLog = await db.auditLog.findFirst({
    where,
    orderBy: { timestamp: "desc" },
    select: { hash: true },
  })
  
  return lastLog?.hash || null
}

/**
 * Detect suspicious patterns in audit logs
 */
async function detectSuspiciousActivity(
  data: AuditLogData,
  _previousHash: string | null
): Promise<{ isSuspicious: boolean; reason?: string }> {
  const reasons: string[] = []
  
  // Check for unusual hours (outside 6:00 - 22:00)
  const hour = new Date().getHours()
  if (hour < 6 || hour > 22) {
    reasons.push(`Actie buiten kantooruren (${hour}:00)`)
  }
  
  // Check for bulk changes in short time
  if (data.action === "UPDATE" || data.action === "DELETE") {
    const recentChanges = await db.auditLog.count({
      where: {
        userId: data.userId,
        action: { in: ["UPDATE", "DELETE"] },
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    })
    
    if (recentChanges > 10) {
      reasons.push(`${recentChanges} wijzigingen in de afgelopen 5 minuten`)
    }
  }
  
  // Check for changes to sent/paid invoices
  if (data.entityType === "invoice" && data.entityId) {
    if (data.action === "UPDATE" || data.action === "DELETE") {
      const invoice = await db.invoice.findUnique({
        where: { id: data.entityId },
        select: { status: true, sentAt: true, paidAt: true },
      })
      
      if (invoice?.sentAt || invoice?.paidAt) {
        reasons.push(
          `Wijziging aan ${invoice.paidAt ? "betaalde" : "verzonden"} factuur`
        )
      }
    }
  }
  
  // Check for changes to closed periods (VAT reports)
  if (data.entityType === "vat_report" && data.action === "UPDATE") {
    const report = await db.vATReport.findUnique({
      where: { id: data.entityId! },
      select: { status: true },
    })
    
    if (report?.status === "FILED") {
      reasons.push("Wijziging aan ingediende BTW-aangifte")
    }
  }
  
  // Check for multiple failed login attempts
  if (data.action === "LOGIN_FAILED") {
    const recentFailures = await db.auditLog.count({
      where: {
        userEmail: data.userEmail,
        action: "LOGIN_FAILED",
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    })
    
    if (recentFailures >= 5) {
      reasons.push(`${recentFailures} mislukte loginpogingen in 15 minuten`)
    }
  }
  
  // Check for unknown IP addresses (if we have previous logs)
  if (data.ipAddress) {
    const knownIPs = await db.auditLog.findMany({
      where: {
        userId: data.userId,
        ipAddress: { not: null },
      },
      select: { ipAddress: true },
      distinct: ["ipAddress"],
      take: 10,
    })
    
    const knownIPSet = new Set(knownIPs.map((log) => log.ipAddress))
    if (knownIPs.length > 0 && !knownIPSet.has(data.ipAddress)) {
      reasons.push(`Onbekend IP-adres: ${data.ipAddress}`)
    }
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
  }
}

/**
 * Get request context (IP, user agent, session)
 */
async function getRequestContext(): Promise<{
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}> {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      undefined
    const userAgent = headersList.get("user-agent") || undefined
    
    // Session ID from cookie or header
    const sessionId =
      headersList.get("x-session-id") ||
      headersList
        .get("cookie")
        ?.split(";")
        .find((c) => c.trim().startsWith("next-auth.session-token="))
        ?.split("=")[1] ||
      undefined
    
    return { ipAddress, userAgent, sessionId }
  } catch {
    return {}
  }
}

/**
 * Create an audit log entry
 * This is the main function to log any action
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Get request context
    const context = await getRequestContext()
    
    // Get previous hash for chain integrity
    const previousHash = await getPreviousHash(data.userId)
    
    // Detect suspicious activity
    const suspicious = await detectSuspiciousActivity(data, previousHash)
    
    // Calculate hash for this entry
    const timestamp = new Date()
    const hash = calculateHash({
      timestamp,
      userId: data.userId || null,
      userEmail: data.userEmail,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      changes: data.changes || null,
      previousHash,
    })
    
    // Create audit log entry (async, don't wait for it)
    db.auditLog
      .create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          ipAddress: context.ipAddress || data.ipAddress,
          userAgent: context.userAgent || data.userAgent,
          sessionId: context.sessionId || data.sessionId,
          previousHash,
          hash,
          isSuspicious: suspicious.isSuspicious,
          suspiciousReason: suspicious.reason,
        },
      })
      .catch((error) => {
        // Log error but don't throw - audit logging should never break the main flow
        console.error("Failed to create audit log:", error)
      })
  } catch (error) {
    // Silently fail - audit logging should never break the main flow
    console.error("Audit log error:", error)
  }
}

