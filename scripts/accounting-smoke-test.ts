/**
 * Accounting Integration – Smoke Test
 *
 * Verifies that all required environment variables are set, the database is
 * reachable, and the encryption key is functional. Optionally tests live
 * provider connections when test-token env vars are present.
 *
 * Usage:
 *   npx tsx scripts/accounting-smoke-test.ts
 *
 * Exit code 0 = all checks passed
 * Exit code 1 = one or more checks failed (suitable for CI/CD gates)
 *
 * Optional live-connection env vars (omit to skip those checks):
 *   MONEYBIRD_TEST_TOKEN     Personal access token from moneybird.com/user/applications
 *   MONEYBIRD_TEST_ADMIN_ID  Administration ID from the Moneybird URL
 *   EXACT_TEST_TOKEN         OAuth access token for Exact Online sandbox
 *   EXACT_TEST_ADMIN_ID      Division code for the Exact sandbox
 *   YUKI_TEST_API_KEY        Web Service Access Key from Yuki
 *   YUKI_TEST_ADMIN_ID       Domain GUID from Yuki
 */

import 'dotenv/config'
import { randomBytes } from 'crypto'
import { encrypt, decrypt } from '../lib/crypto'
import { db } from '../lib/db'
import { getAdapter } from '../lib/accounting/adapter-factory'
import { AccountingProvider } from '@prisma/client'

// ── ANSI output helpers ───────────────────────────────────────────────────────

const G = '\x1b[32m'   // green
const R = '\x1b[31m'   // red
const Y = '\x1b[33m'   // yellow
const B = '\x1b[1m'    // bold
const D = '\x1b[2m'    // dim
const Z = '\x1b[0m'    // reset

let passed = 0
let failed = 0

function pass(label: string, detail?: string): void {
  passed++
  const suffix = detail ? `  ${D}${detail}${Z}` : ''
  console.log(`  ${G}✓ PASS${Z}  ${label}${suffix}`)
}

function fail(label: string, detail?: string): void {
  failed++
  const suffix = detail ? `  ${R}${detail}${Z}` : ''
  console.log(`  ${R}✗ FAIL${Z}  ${label}${suffix}`)
}

function skip(label: string, reason?: string): void {
  const suffix = reason ? `  ${D}${reason}${Z}` : ''
  console.log(`  ${D}– SKIP${Z}  ${label}${suffix}`)
}

function section(title: string, index: number, total: number): void {
  console.log(`\n${B}[${index}/${total}] ${title}${Z}`)
}

// ── Check helpers ─────────────────────────────────────────────────────────────

function checkEnvVar(name: string, validate?: (v: string) => string | null): void {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    fail(name, 'not set or empty')
    return
  }
  if (validate) {
    const error = validate(value)
    if (error) {
      fail(name, error)
      return
    }
  }
  // Show a hint about the value's shape without revealing the secret
  const hint = value.length <= 6 ? '***' : `${value.slice(0, 3)}…(${value.length} chars)`
  pass(name, hint)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${B}=== Declair Accounting Smoke Test ===${Z}`)
  console.log(`${D}${new Date().toISOString()}${Z}`)

  const TOTAL_SECTIONS = 4

  // ── Section 1: Required env vars ──────────────────────────────────────────

  section('Required environment variables', 1, TOTAL_SECTIONS)

  checkEnvVar('DATABASE_URL')
  checkEnvVar('ENCRYPTION_KEY', (v) => {
    if (!/^[0-9a-fA-F]{64}$/.test(v)) {
      return 'must be exactly 64 hex characters (32 bytes)'
    }
    return null
  })

  // OAuth providers (required for the OAuth connect flow to work)
  const oauthVarPairs: Array<[string, string]> = [
    ['MONEYBIRD_CLIENT_ID', 'MONEYBIRD_CLIENT_SECRET'],
    ['EXACT_CLIENT_ID',     'EXACT_CLIENT_SECRET'],
  ]

  for (const [idVar, secretVar] of oauthVarPairs) {
    checkEnvVar(idVar)
    checkEnvVar(secretVar)
  }

  // NEXT_PUBLIC_APP_URL (used to build redirect URIs)
  checkEnvVar('NEXT_PUBLIC_APP_URL', (v) => {
    try {
      new URL(v)
      return null
    } catch {
      return 'must be a valid URL (e.g. https://app.declair.nl)'
    }
  })

  // ── Section 2: Encryption roundtrip ───────────────────────────────────────

  section('Encryption roundtrip', 2, TOTAL_SECTIONS)

  try {
    const plaintext = `smoke-test-${randomBytes(16).toString('hex')}`
    const ciphertext = encrypt(plaintext)
    const decrypted = decrypt(ciphertext)

    if (decrypted !== plaintext) {
      fail('encrypt → decrypt roundtrip', 'decrypted value does not match original')
    } else {
      // Verify the expected iv:authTag:ciphertext format
      const parts = ciphertext.split(':')
      if (parts.length !== 3) {
        fail('ciphertext format', `expected 3 parts, got ${parts.length}`)
      } else {
        pass('encrypt → decrypt roundtrip')
        pass('ciphertext format', 'iv:authTag:ciphertext ✓')
      }
    }
  } catch (err) {
    fail('encrypt → decrypt roundtrip', err instanceof Error ? err.message : String(err))
  }

  // Verify that a wrong key fails authentication
  try {
    const ciphertext = encrypt('canary')
    const wrongKey = randomBytes(32).toString('hex')
    try {
      decrypt(ciphertext, wrongKey)
      fail('wrong-key rejection', 'decrypt should have thrown with wrong key')
    } catch {
      pass('wrong-key rejection', 'tampered ciphertext correctly rejected')
    }
  } catch (err) {
    fail('wrong-key rejection', err instanceof Error ? err.message : String(err))
  }

  // ── Section 3: Database connection ────────────────────────────────────────

  section('Database connection', 3, TOTAL_SECTIONS)

  try {
    const count = await db.accountingConnection.count()
    pass('AccountingConnection table reachable', `${count} row(s)`)
  } catch (err) {
    fail(
      'AccountingConnection table reachable',
      err instanceof Error ? err.message : String(err),
    )
  } finally {
    await db.$disconnect().catch(() => undefined)
  }

  // ── Section 4: Provider connection tests (optional) ───────────────────────

  section('Provider connection tests', 4, TOTAL_SECTIONS)

  const providerTests: Array<{
    label: string
    provider: AccountingProvider
    tokenVar: string
    adminVar: string
  }> = [
    {
      label: 'Moneybird',
      provider: AccountingProvider.MONEYBIRD,
      tokenVar: 'MONEYBIRD_TEST_TOKEN',
      adminVar: 'MONEYBIRD_TEST_ADMIN_ID',
    },
    {
      label: 'Exact Online',
      provider: AccountingProvider.EXACT,
      tokenVar: 'EXACT_TEST_TOKEN',
      adminVar: 'EXACT_TEST_ADMIN_ID',
    },
    {
      label: 'Yuki',
      provider: AccountingProvider.YUKI,
      tokenVar: 'YUKI_TEST_API_KEY',
      adminVar: 'YUKI_TEST_ADMIN_ID',
    },
  ]

  let anyProviderTested = false

  for (const { label, provider, tokenVar, adminVar } of providerTests) {
    const token = process.env[tokenVar]
    const adminId = process.env[adminVar]

    if (!token || !adminId) {
      skip(
        `${label} validateConnection()`,
        `set ${tokenVar} + ${adminVar} to enable`,
      )
      continue
    }

    anyProviderTested = true

    try {
      const adapter = await getAdapter(provider, token, adminId)
      const ok = await adapter.validateConnection()
      if (ok) {
        pass(`${label} validateConnection()`, 'connected successfully')
      } else {
        fail(`${label} validateConnection()`, 'returned false – check credentials')
      }
    } catch (err) {
      fail(
        `${label} validateConnection()`,
        err instanceof Error ? err.message : String(err),
      )
    }
  }

  if (!anyProviderTested) {
    console.log(
      `\n  ${D}Tip: set TEST_TOKEN + TEST_ADMIN_ID env vars to run live provider tests.${Z}`,
    )
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  const status = failed === 0
    ? `${G}${B}${passed} passed, 0 failed${Z}`
    : `${R}${B}${passed} passed, ${failed} failed${Z}`

  console.log(`\n${B}=== Result: ${status} ${B}===${Z}\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`\n${R}Unexpected error:${Z}`, err)
  process.exit(1)
})
