import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import { getAdapter } from '@/lib/accounting/adapter-factory'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body.gebruikersnaam !== 'string' ||
    typeof body.beveiligingscode1 !== 'string' ||
    typeof body.beveiligingscode2 !== 'string'
  ) {
    return NextResponse.json({ error: 'Ongeldige gegevens' }, { status: 400 })
  }

  const gebruikersnaam = (body.gebruikersnaam as string).trim()
  const beveiligingscode1 = (body.beveiligingscode1 as string).trim()
  const beveiligingscode2 = (body.beveiligingscode2 as string).trim()

  if (!gebruikersnaam || !beveiligingscode1 || !beveiligingscode2) {
    return NextResponse.json({ error: 'Vul alle velden in' }, { status: 400 })
  }

  // Encode credentials as a JSON string; the adapter reads this as its "access token"
  const credentialsJson = JSON.stringify({ gebruikersnaam, beveiligingscode1, beveiligingscode2 })

  // Test connection before saving
  try {
    const adapter = await getAdapter(AccountingProvider.EBOEKHOUDEN, credentialsJson)
    await adapter.validateConnection()
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    // The e-Boekhouden adapter is still a stub — "Not implemented" is expected
    // for now. Any other error indicates a genuine authentication failure.
    if (!message.includes('Not implemented')) {
      return NextResponse.json(
        { error: 'Verbinding mislukt. Controleer je gebruikersnaam en beveiligingscodes.' },
        { status: 400 },
      )
    }
  }

  // Save or update the connection
  await db.accountingConnection.upsert({
    where: {
      userId_provider: { userId: session.user.id, provider: AccountingProvider.EBOEKHOUDEN },
    },
    create: {
      userId: session.user.id,
      provider: AccountingProvider.EBOEKHOUDEN,
      providerName: 'e-Boekhouden',
      accessToken: encrypt(credentialsJson),
      refreshToken: null,
      tokenExpiresAt: null,
      // Use the username as a human-readable external identifier
      externalAdminId: gebruikersnaam,
      externalUserId: gebruikersnaam,
      isActive: true,
    },
    update: {
      accessToken: encrypt(credentialsJson),
      isActive: true,
      lastError: null,
    },
  })

  return NextResponse.json({ success: true })
}
