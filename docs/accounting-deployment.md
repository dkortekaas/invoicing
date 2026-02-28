# Accounting Integration – Deployment Checklist

Volg deze checklist voor elke omgeving afzonderlijk (local → staging → production).
Sla geen stappen over: een verkeerde `ENCRYPTION_KEY` maakt alle opgeslagen tokens
onleesbaar.

---

## Stap 0 – Voorbereiding

Voer het smoke-test script uit na elke omgeving om te verifiëren dat alles correct
is geconfigureerd:

```bash
npx tsx scripts/accounting-smoke-test.ts
```

Het script controleert env vars, de databaseverbinding en de encryptie roundtrip.
Exit code 1 bij een of meer gefaalde checks (bruikbaar in CI/CD pipelines).

---

## Stap 1 – ENCRYPTION_KEY aanmaken

> **Waarschuwing:** Genereer per omgeving een unieke sleutel. Gebruik **nooit**
> dezelfde sleutel in local en production. Sla de sleutel veilig op (bijv.
> in een password manager of secret store) — hij is niet te herstellen.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Kopieer de output (64 hex-tekens) naar `ENCRYPTION_KEY` in de juiste `.env`.

> **Staging + gedeelde DB:** Als staging en production dezelfde PostgreSQL-database
> gebruiken, **moet** `ENCRYPTION_KEY` identiek zijn, anders zijn de opgeslagen
> tokens in de gedeelde tabel niet te ontsleutelen.

### Checklist

- [ ] `ENCRYPTION_KEY` gegenereerd en ingesteld (64 hex-tekens / 32 bytes)
- [ ] Sleutel veilig opgeslagen buiten het versiebeheersysteem
- [ ] Sleutel **verschilt** van alle andere omgevingen (tenzij gedeelde DB – zie boven)

---

## Stap 2 – OAuth-applicaties aanmaken bij providers

### 2a – Moneybird

1. Ga naar <https://moneybird.com/user/applications> → **+ Nieuwe applicatie**
2. Stel in:
   - **Redirect URI:** `https://{domain}/api/accounting/callback/moneybird`
   - **Scopes:** `sales_invoices documents contacts settings`
3. Kopieer **Client ID** en **Client Secret** naar `.env`:

```env
MONEYBIRD_CLIENT_ID=<client_id>
MONEYBIRD_CLIENT_SECRET=<client_secret>
```

- [ ] Moneybird OAuth-applicatie aangemaakt
- [ ] `MONEYBIRD_CLIENT_ID` ingesteld
- [ ] `MONEYBIRD_CLIENT_SECRET` ingesteld
- [ ] Redirect URI geregistreerd: `https://{domain}/api/accounting/callback/moneybird`

---

### 2b – Exact Online

1. Ga naar <https://apps.exactonline.com/> → **Mijn apps** → **Nieuwe app**
2. Stel in:
   - **Redirect URI:** `https://{domain}/api/accounting/callback/exact`
   - **Scopes:** `financial salesentries`
3. Kopieer **Client ID** en **Client Secret** naar `.env`:

```env
EXACT_CLIENT_ID=<client_id>
EXACT_CLIENT_SECRET=<client_secret>
```

- [ ] Exact Online OAuth-applicatie aangemaakt
- [ ] `EXACT_CLIENT_ID` ingesteld
- [ ] `EXACT_CLIENT_SECRET` ingesteld
- [ ] Redirect URI geregistreerd: `https://{domain}/api/accounting/callback/exact`

---

### 2c – Yuki

Yuki werkt met een **Web Service Access Key** (API-sleutel), niet met OAuth.
Elke klant genereert zijn eigen key in Yuki onder: **Beheer → Web services**.

De key wordt opgeslagen als `accessToken` in `AccountingConnection` en is
versleuteld via `ENCRYPTION_KEY`.

De variabelen `YUKI_CLIENT_ID` en `YUKI_CLIENT_SECRET` zijn gereserveerd voor
een toekomstige Yuki OAuth-integratie en hoeven nu **niet** ingesteld te worden.

- [ ] Klanten geïnformeerd dat ze hun Web Service Access Key uit Yuki nodig hebben
- [ ] `YUKI_CLIENT_ID` en `YUKI_CLIENT_SECRET` weggezet als placeholders (voor later)

---

### 2d – e-Boekhouden

e-Boekhouden gebruikt gebruikersnaam + twee beveiligingscodes (geen OAuth).
Klanten voeren deze rechtstreeks in via het koppelingsformulier in de app.
Er zijn geen server-side OAuth-credentials nodig.

---

## Stap 3 – App URL instellen

De `NEXT_PUBLIC_APP_URL` wordt gebruikt om OAuth-redirect URIs te construeren.
Zorg dat deze exact overeenkomt met het domein dat je hebt ingesteld bij de providers.

```env
NEXT_PUBLIC_APP_URL=https://app.declair.nl      # production
NEXT_PUBLIC_APP_URL=https://staging.declair.nl  # staging
NEXT_PUBLIC_APP_URL=http://localhost:3000        # local
```

- [ ] `NEXT_PUBLIC_APP_URL` ingesteld en overeenkomend met geregistreerde redirect URIs

---

## Stap 4 – Database migratie uitvoeren

```bash
npx prisma migrate deploy
```

Dit past alle openstaande migraties toe op de productiedatabase. Vereist dat
`DATABASE_URL` correct is ingesteld.

De volgende modellen zijn betrokken bij de accounting-integratie:
- `AccountingConnection`
- `LedgerMapping`, `VatMapping`
- `AccountingSyncLog`
- `SyncedCustomer`, `SyncedInvoice`, `SyncedCreditNote`

- [ ] Database migratie succesvol uitgevoerd
- [ ] Geen `prisma migrate dev` gebruikt in productie (gebruik altijd `migrate deploy`)

---

## Stap 5 – Smoke test draaien

```bash
npx tsx scripts/accounting-smoke-test.ts
```

Verwachte output bij een correcte configuratie:

```
=== Declair Accounting Smoke Test ===

[1/4] Required environment variables
  ✓ PASS  DATABASE_URL
  ✓ PASS  ENCRYPTION_KEY  (64 hex chars)
  ✓ PASS  MONEYBIRD_CLIENT_ID
  ✓ PASS  MONEYBIRD_CLIENT_SECRET
  ...

[2/4] Encryption roundtrip
  ✓ PASS  encrypt → decrypt roundtrip

[3/4] Database connection
  ✓ PASS  AccountingConnection rows: 0

[4/4] Provider connection tests
  (skipped – set MONEYBIRD_TEST_TOKEN + MONEYBIRD_TEST_ADMIN_ID to test live)

=== Result: 4 passed, 0 failed ===
```

- [ ] Smoke test geeft `0 failed`

---

## Stap 6 – Vercel-specifieke configuratie

### Env vars instellen in Vercel

Ga naar: **Vercel Dashboard → Project → Settings → Environment Variables**

Stel per variabele in voor welke omgeving(en) hij geldt:

| Variabele | Local | Preview (staging) | Production |
|---|---|---|---|
| `ENCRYPTION_KEY` | `.env.local` | ✅ (eigen waarde) | ✅ (eigen waarde) |
| `MONEYBIRD_CLIENT_ID` | `.env.local` | ✅ | ✅ |
| `MONEYBIRD_CLIENT_SECRET` | `.env.local` | ✅ | ✅ |
| `EXACT_CLIENT_ID` | `.env.local` | ✅ | ✅ |
| `EXACT_CLIENT_SECRET` | `.env.local` | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | `.env.local` | ✅ (staging URL) | ✅ (productie URL) |
| `DATABASE_URL` | `.env.local` | ✅ (staging DB) | ✅ (productie DB) |

> **Let op:** Vercel Preview deployments gebruiken de **Preview** env vars.
> Als je OAuth-callbacks wilt testen vanuit een preview deployment, moet de
> redirect URI voor de preview-URL ook zijn geregistreerd bij de provider.

### Aparte OAuth-apps per omgeving (aanbevolen)

Maak bij Moneybird en Exact **twee** OAuth-applicaties aan:
- Eén voor production (redirect URI → productiedomein)
- Eén voor staging/preview (redirect URI → stagingdomein)

Dit voorkomt dat een staging-test echte productieboekhouddata muteert.

### `ENCRYPTION_KEY` en gedeelde databases

Als staging en production **dezelfde** database gebruiken (niet aanbevolen):
- Gebruik **dezelfde** `ENCRYPTION_KEY` voor beide omgevingen
- Anders zijn de opgeslagen tokens onleesbaar na een deployment naar de andere omgeving

Als staging een **eigen** database heeft:
- Gebruik **verschillende** `ENCRYPTION_KEY` waarden (standaard en aanbevolen)

---

## Stap 7 – Sleutelrotatie (toekomstig gebruik)

Bij het roteren van `ENCRYPTION_KEY`:
1. Schrijf een migratiescript dat alle `AccountingConnection.accessToken` en
   `refreshToken` velden ontsleutelt met de oude sleutel en herversleutelt met de nieuwe.
2. Voer het script atomair uit (bij voorkeur binnen een transactie).
3. Deploy pas nadat de migratie klaar is.

Er is momenteel geen geautomatiseerd rotatiescript — plan dit in als onderdeel
van de reguliere security maintenance.

---

## Samenvatting per omgeving

### Local (`.env.local`)

```env
DATABASE_URL=postgresql://localhost:5432/declair_dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=<64-hex-chars>
MONEYBIRD_CLIENT_ID=<client_id>
MONEYBIRD_CLIENT_SECRET=<client_secret>
EXACT_CLIENT_ID=<client_id>
EXACT_CLIENT_SECRET=<client_secret>
```

### Staging (Vercel Preview env vars)

```env
DATABASE_URL=<staging-db-url>
NEXT_PUBLIC_APP_URL=https://staging.declair.nl
ENCRYPTION_KEY=<64-hex-chars-eigen-waarde>
MONEYBIRD_CLIENT_ID=<staging-client_id>
MONEYBIRD_CLIENT_SECRET=<staging-client_secret>
EXACT_CLIENT_ID=<staging-client_id>
EXACT_CLIENT_SECRET=<staging-client_secret>
```

### Production (Vercel Production env vars)

```env
DATABASE_URL=<production-db-url>
NEXT_PUBLIC_APP_URL=https://app.declair.nl
ENCRYPTION_KEY=<64-hex-chars-productie-waarde>
MONEYBIRD_CLIENT_ID=<productie-client_id>
MONEYBIRD_CLIENT_SECRET=<productie-client_secret>
EXACT_CLIENT_ID=<productie-client_id>
EXACT_CLIENT_SECRET=<productie-client_secret>
```
