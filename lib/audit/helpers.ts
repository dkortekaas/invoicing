"use server"

import { createAuditLog } from "./logger"
import { detectChanges } from "./utils"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

/**
 * Get user email for audit logging
 */
async function getUserEmail(userId?: string): Promise<string> {
  if (!userId) {
    return "system"
  }
  
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    return user?.email || "unknown"
  } catch {
    return "unknown"
  }
}

/**
 * Log a CREATE action
 */
export async function logCreate(
  entityType: string,
  entityId: string,
  data: Record<string, any>,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "CREATE",
    entityType,
    entityId,
    changes: Object.keys(data).reduce((acc, key) => {
      acc[key] = { oldValue: null, newValue: data[key] }
      return acc
    }, {} as Record<string, { oldValue: any; newValue: any }>),
  })
}

/**
 * Log an UPDATE action with change detection
 */
export async function logUpdate(
  entityType: string,
  entityId: string,
  oldData: Record<string, any> | null,
  newData: Record<string, any>,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  const changes = detectChanges(oldData, newData)
  
  if (Object.keys(changes).length > 0) {
    await createAuditLog({
      userId: actualUserId,
      userEmail,
      action: "UPDATE",
      entityType,
      entityId,
      changes,
    })
  }
}

/**
 * Log a DELETE action
 */
export async function logDelete(
  entityType: string,
  entityId: string,
  deletedData: Record<string, any>,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "DELETE",
    entityType,
    entityId,
    changes: Object.keys(deletedData).reduce((acc, key) => {
      acc[key] = { oldValue: deletedData[key], newValue: null }
      return acc
    }, {} as Record<string, { oldValue: any; newValue: any }>),
  })
}

/**
 * Log a VIEW action (for sensitive data access)
 */
export async function logView(
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "VIEW",
    entityType,
    entityId,
    metadata,
  })
}

/**
 * Log an EXPORT action
 */
export async function logExport(
  entityType: string,
  format: string,
  filters?: Record<string, any>,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "EXPORT",
    entityType,
    metadata: {
      format,
      filters,
    },
  })
}

/**
 * Log a LOGIN action
 */
export async function logLogin(
  userEmail: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    userEmail,
    action: "LOGIN",
    entityType: "user",
    entityId: userId,
    metadata,
  })
}

/**
 * Log a LOGOUT action
 */
export async function logLogout(
  userEmail: string,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    userEmail,
    action: "LOGOUT",
    entityType: "user",
    entityId: userId,
  })
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailed(
  userEmail: string,
  reason?: string
): Promise<void> {
  await createAuditLog({
    userEmail,
    action: "LOGIN_FAILED",
    entityType: "user",
    metadata: {
      reason,
    },
  })
}

/**
 * Log a payment recorded action
 */
export async function logPaymentRecorded(
  invoiceId: string,
  amount: number,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "PAYMENT_RECORDED",
    entityType: "invoice",
    entityId: invoiceId,
    metadata: {
      amount,
    },
  })
}

/**
 * Log an invoice sent action
 */
export async function logInvoiceSent(
  invoiceId: string,
  recipient: string,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "INVOICE_SENT",
    entityType: "invoice",
    entityId: invoiceId,
    metadata: {
      recipient,
    },
  })
}

/**
 * Log settings changes
 */
export async function logSettingsChange(
  settingType: string,
  oldValue: any,
  newValue: any,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "SETTINGS_CHANGED",
    entityType: "settings",
    metadata: {
      settingType,
      oldValue,
      newValue,
    },
  })
}

/**
 * Log password change
 */
export async function logPasswordChange(
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: "PASSWORD_CHANGED",
    entityType: "user",
    entityId: actualUserId,
  })
}

/**
 * Log 2FA enable/disable
 */
export async function log2FAChange(
  enabled: boolean,
  userId?: string
): Promise<void> {
  const actualUserId = userId || (await getCurrentUserId().catch(() => undefined))
  const userEmail = await getUserEmail(actualUserId)
  
  await createAuditLog({
    userId: actualUserId,
    userEmail,
    action: enabled ? "TWO_FA_ENABLED" : "TWO_FA_DISABLED",
    entityType: "user",
    entityId: actualUserId,
  })
}
