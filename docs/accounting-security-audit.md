<!--
  DECLAIR BOEKHOUDING – Accounting Integration Security & GDPR Audit
  Ticket: #29
  Date: 2026-02-28
  Scope: lib/accounting/**, app/api/accounting/**, prisma/schema.prisma
-->

# Accounting Integration – Security & GDPR Audit

## 1. Token Storage

**Result: PASS**

Every code path that persists an `accessToken` or `refreshToken` to the database
wraps the value in `encrypt()` from `lib/crypto.ts` (AES-256-GCM):

| File | Lines |
|---|---|
| `app/api/accounting/callback/[provider]/route.ts` | 76-77, 84-85 |
| `app/api/accounting/connect/finalize/route.ts` | 75-76, 83-84 |
| `app/api/accounting/connect/eboekhouden/save/route.ts` | 60, 69 |
| `lib/accounting/token-manager.ts` – `updateConnectionTokens()` | 82-84 |
| `lib/accounting/sync-service.ts` – `getActiveAdapter()` | 119-122 |

The short-lived multi-admin cookie (`oauth_pending_tokens`) is also encrypted
before being set (`callback/[provider]/route.ts:101`).

No `console.log`, `JSON.stringify`, API response, or error message exposes a raw
token. The `GET /api/accounting/status` route uses a Prisma `select` projection
that explicitly omits `accessToken` and `refreshToken`.

---

## 2. Sync Log Data

**Result: FIXED** (was: FAIL)

### Problem

`lib/accounting/sync-service.ts` logged the full `CustomerPayload` as
`requestPayload` in `AccountingSyncLog`. This payload included:

```
phone · address · zipcode · city · country · chamberOfCommerce · taxNumber
```

These fields constitute personal data under GDPR Art. 4(1) and are unnecessary
for debugging sync failures.

**Affected sync functions:** `syncCustomer`, `syncInvoice` (create branch),
`syncCreditNote`.

### Fix

Added `sanitizePayload(payload: unknown): unknown` to `sync-service.ts`
(exported for testability). The function:

- Strips the seven PII fields listed above from any object at any depth.
- Recursively sanitizes nested `customer` objects inside `InvoicePayload` /
  `CreditNotePayload`.
- Is a pure function with no side effects; safe to call on any JSON-compatible
  value.

All six `requestPayload` writes (success + failure path of each sync function)
now pass through `sanitizePayload()`.

**What remains in logs (acceptable):**
- Customer: `companyName`, `firstName`, `lastName`, `email`
- Invoice: `invoiceNumber`, `date`, `dueDate`, `items` (descriptions + amounts),
  VAT/ledger mapping IDs, `externalCustomerId`
- Response: external IDs and URLs only

**What is never logged:**
- Raw tokens, passwords, or security codes
- BSN numbers (not stored in `Customer` model)
- IBAN (stored on `User`, never included in customer/invoice payloads)
- Full credit card numbers (no card data in the system)

---

## 3. Account Deletion Cascade

**Result: PASS (schema) + NEW UTILITY**

### Schema cascade

`AccountingConnection` declares `onDelete: Cascade` on its `User` foreign key
(`prisma/schema.prisma:2252`). A `User` deletion therefore removes all
`AccountingConnection` rows, which in turn cascade to:

| Child model | onDelete |
|---|---|
| `LedgerMapping` | Cascade ✅ |
| `VatMapping` | Cascade ✅ |
| `AccountingSyncLog` | Cascade ✅ |
| `SyncedCustomer` | Cascade ✅ |
| `SyncedInvoice` | Cascade ✅ |
| `SyncedCreditNote` | Cascade ✅ |

### Token revocation utility

No user-deletion endpoint currently exists in the codebase. To prepare for
future self-deletion or admin-initiated deletion flows, the new file
`lib/accounting/cleanup.ts` exports:

```typescript
revokeAllTokens(userId: string): Promise<void>
```

This function:
- Loads all active `AccountingConnection` rows for the user.
- Decrypts each token and obtains the provider adapter.
- Calls `adapter.revokeToken()` when the method exists (currently only
  OAuth providers may implement it; Yuki / e-Boekhouden skip silently).
- Uses `Promise.allSettled` so one failure never blocks the others.
- Never throws — revocation is always best-effort before the DB cascade.

**Usage in a future deletion flow:**

```typescript
import { revokeAllTokens } from '@/lib/accounting/cleanup'

await revokeAllTokens(userId)          // revoke OAuth tokens at providers
await db.user.delete({ where: { id: userId } })  // cascade cleans the DB
```

---

## 4. Disconnect Cleanup

**Result: PASS**

`DELETE /api/accounting/disconnect/[provider]` calls
`db.accountingConnection.delete({ where: { id: connection.id } })`.

All six child models (see §3) have `onDelete: Cascade`, so a single connection
delete removes all associated mappings, sync records, and log entries atomically
via the database cascade — no manual cleanup queries are needed.

Token revocation is attempted before the delete (best-effort, errors are caught
and discarded).

---

## 5. Environment Variables

**Result: PASS (after fix)**

### Hardcoded secrets scan

Grep for `/[a-f0-9]{32,}/` across `lib/accounting/**/*.ts` returned **no
matches**. No secrets, API keys, or tokens are hardcoded.

### `.env.example` coverage

Two missing variables were added:

```env
MONEYBIRD_CLIENT_ID=
MONEYBIRD_CLIENT_SECRET=
```

These are required by `MoneybirdAdapter.getAuthUrl()`,
`exchangeCodeForTokens()`, and `refreshAccessToken()` at runtime
(`lib/accounting/adapters/moneybird.ts:36-46`).

All other required variables were already present with empty placeholder values.

### `.gitignore` coverage

The `.gitignore` file contains `.env*` (matches all `.env*` files) and an
explicit `.env.test` entry added during ticket #28.

---

## Summary

| # | Area | Status | Action taken |
|---|---|---|---|
| 1 | Token storage | ✅ Pass | No changes needed |
| 2 | Sync log PII | ✅ Fixed | Added `sanitizePayload()`; applied to 6 log writes |
| 3 | Account deletion | ✅ Fixed | Created `lib/accounting/cleanup.ts` with `revokeAllTokens()` |
| 4 | Disconnect cascade | ✅ Pass | No changes needed |
| 5 | Environment variables | ✅ Fixed | Added `MONEYBIRD_CLIENT_ID/SECRET` to `.env.example` |

### Files changed

| File | Change |
|---|---|
| `lib/accounting/sync-service.ts` | Added `sanitizePayload()`; applied in `syncCustomer`, `syncInvoice`, `syncCreditNote` |
| `lib/accounting/cleanup.ts` | **New** – `revokeAllTokens(userId)` |
| `.env.example` | Added `MONEYBIRD_CLIENT_ID`, `MONEYBIRD_CLIENT_SECRET` |
| `docs/accounting-security-audit.md` | **New** – this document |
