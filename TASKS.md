# Declair – Security, Performance & Usability Takenlijst

Analyse uitgevoerd op: 2026-02-20
Prioritering: **P0 Kritiek → P1 Hoog → P2 Middel → P3 Laag**

---

## Legende

| Label | Omschrijving |
|-------|-------------|
| 🔴 P0 | Kritiek – directe exploitatie of dataverlies mogelijk |
| 🟠 P1 | Hoog – wezenlijk risico of merkbare degradatie |
| 🟡 P2 | Middel – beperkte impact maar structureel probleem |
| 🟢 P3 | Laag – verbeterpunt zonder direct risico |
| 🔒 SEC | Security |
| ⚡ PERF | Performance |
| 🎨 UX | Usability |

---

## 🔴 P0 – Kritiek

### SEC-01 · Login-endpoint mist rate limiting
**Bestanden:** `lib/auth.ts:21-113`

De `check-2fa` API-route (`app/api/auth/check-2fa/route.ts:10`) beveiligt de
pre-check met rate limiting op IP, maar de échte authenticatie verloopt via
NextAuth's `POST /api/auth/callback/credentials`. Die callback roept direct
`authorize()` aan in `lib/auth.ts` – zonder enige rate limiting.

Een aanvaller kan `/api/auth/callback/credentials` rechtstreeks bestoken en de
`check-2fa`-beveiliging volledig omzeilen.

**Actie:**
```ts
// lib/auth.ts – in authorize(), vóór de DB-aanroep
const ip = (headers().get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
const { allowed } = rateLimit(`login:${ip}`, RATE_LIMITS.login)
if (!allowed) return null
```

---

### SEC-02 · Export-API's controleren geen feature-toegang
**Bestanden:**
- `app/api/export/invoices/route.ts`
- `app/api/export/customers/route.ts`
- `app/api/export/products/route.ts`
- `app/api/export/expenses/route.ts`
- `app/api/export/time-entries/route.ts`

Alle export-routes controleren alleen of de gebruiker ingelogd is, maar roepen
**nooit** `hasFeatureAccess(userId, 'export')` aan. `export` vereist STARTER of
hoger (`lib/stripe/subscriptions.ts:45`). Een FREE-gebruiker kan via directe
API-aanroep onbeperkt exporteren.

**Actie:** Voeg aan elke export-route toe vóór de buffer-aanroep:
```ts
const hasAccess = await hasFeatureAccess(session.user.id, 'export')
if (!hasAccess) {
  return NextResponse.json({ error: 'Export vereist een betaald abonnement' }, { status: 403 })
}
```

---

### SEC-03 · Import-API mist feature-toegangscheck
**Bestand:** `app/api/import/upload/route.ts:24-30`

De upload-route controleert sessie maar niet `hasFeatureAccess(userId, 'export')`
(import/export zijn dezelfde feature-gate). FREE-gebruikers kunnen data importeren
door de UI te omzeilen.

Zelfde patroon als SEC-02.

---

## 🟠 P1 – Hoog

### SEC-04 · Rolwijziging admin wordt niet geauditlogd
**Bestand:** `app/api/admin/users/[id]/role/route.ts:41-44`

```ts
const user = await db.user.update({
  where: { id },
  data: { role },   // ← geen logCreate/logUpdate aanroep
})
```

Privilege-escalatie (USER → ADMIN → SUPERUSER) is onherleidbaar. Andere admin-
acties gebruiken wel `logUpdate()` uit `lib/audit/helpers`.

**Actie:** Voeg audit logging toe na de update:
```ts
await logUpdate('user', id, { role: existingUser.role }, { role }, session.user.id)
```

---

### SEC-05 · Bestandsupload valideert alleen MIME-type (client-gestuurd)
**Bestand:** `app/api/upload/receipt/route.ts:20-29`

`file.type` komt uit de `Content-Type` header van de client en kan triviaal worden
gespoofed. Een `.php`-bestand kan worden geüpload als `image/png`.

**Actie:** Controleer de daadwerkelijke magic bytes met het `file-type` npm-pakket:
```ts
import { fileTypeFromBuffer } from 'file-type'
const buffer = Buffer.from(await file.arrayBuffer())
const detected = await fileTypeFromBuffer(buffer)
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
if (!detected || !ALLOWED_MIME.includes(detected.mime)) {
  return NextResponse.json({ error: 'Ongeldig bestandstype' }, { status: 400 })
}
```

---

### PERF-01 · Factuurlijst laadt alle facturen zonder paginering
**Bestand:** `app/facturen/actions.ts:24-30`

```ts
const invoices = await db.invoice.findMany({
  where,
  orderBy: { invoiceDate: 'desc' },
  include: { customer: true, items: true },  // volledige data voor elke factuur
})
```

Geen `take`/`skip`. Met 300 facturen worden alle rijen + alle klantobjecten + alle
regelitems in één keer geladen. Dit schaalt niet.

**Actie:**
1. Voeg server-side paginering toe (`take`, `skip`).
2. Gebruik `select` in plaats van `include: { customer: true }` voor de lijstweergave:
```ts
select: {
  id: true, invoiceNumber: true, status: true,
  invoiceDate: true, dueDate: true, total: true,
  customer: { select: { name: true, companyName: true } },
}
```
3. Verwijder `items: true` uit de lijstquery (items zijn alleen nodig in de detailweergave).

---

### PERF-02 · Klantenlijst heeft geen paginering
**Bestand:** `app/klanten/actions.ts:12-20`

`db.customer.findMany()` laadt alle klanten zonder limiet. Bij 500+ klanten
veroorzaakt dit trage pagina's en hoge geheugendruk op de server.

**Actie:** Voeg paginering toe en overweeg een server-side zoekfunctie op naam/e-mail.

---

### UX-01 · Geen zoek- en filtermogelijkheid in factuurlijst
**Bestand:** `app/facturen/actions.ts:17-31`

`getInvoices()` filtert alleen op `status`. Klanten met veel facturen hebben geen
manier om snel op klantnaam, factuurnummer of datumbereik te zoeken, tenzij dit
client-side in de volledige dataset wordt gedaan (wat afhangt van PERF-01).

**Actie:** Voeg `search`, `customerId`, `dateFrom`, `dateTo` parameters toe aan de
server-action en verwerk ze in de `where`-clausule.

---

## 🟡 P2 – Middel

### SEC-06 · In-memory rate limiter werkt niet op serverless
**Bestand:** `lib/rate-limit.ts:1-101`

De rate limiter gebruikt een in-process `Map`. Op Vercel (serverless) heeft elke
functie-instantie eigen geheugen; parallelle instanties kennen elkaars tellers niet.
Het `lib/rate-limit.ts`-bestand bevat zelf al een comment hierover maar er is geen
oplossing geïmplementeerd.

Dit raakt alle beveiligde endpoints: login, wachtwoord-reset, upload, contact.

**Actie:** Implementeer Redis-backed rate limiting via `@upstash/redis` en
`@upstash/ratelimit`. Voeg `REDIS_URL` en `REDIS_TOKEN` toe als omgevingsvariabelen.
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
})
```

---

### SEC-07 · Sessies verlopen niet bij rolwijziging
**Bestanden:** `lib/auth.ts:119-133`, `app/api/admin/users/[id]/role/route.ts`

JWT-sessies worden aangemaakt met de initiële rol. Als een gebruiker van USER naar
ADMIN wordt gepromoveerd (of vice versa), blijven bestaande sessies geldig tot
natuurlijk verloop. De nieuwe rol is pas actief na uitloggen en opnieuw inloggen.

**Actie:** Voeg een `sessionVersion`-veld toe aan het `User`-model. Verhoog dit bij
rolwijziging. Controleer het in de `session`-callback en ongeldig de JWT als de
versie niet overeenkomt.

---

### SEC-08 · Audit log-endpoint heeft geen bovengrens op `limit`
**Bestand:** `app/api/audit-logs/route.ts:27`

```ts
const limit = parseInt(searchParams.get("limit") || "50")
// Geen maximum; limit=100000 is geldig
```

Een admin kan onbedoeld of kwaadwillig miljoenen rijen opvragen in één request.

**Actie:**
```ts
const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500)
```

---

### PERF-03 · Factuurlijst laadt overbodige nested data
**Bestand:** `app/facturen/actions.ts:26-29`

Aanvullend op PERF-01: `include: { customer: true }` laadt het volledige
klantobject (inclusief adres, BTW-nummer, IBAN, etc.) terwijl de lijstweergave
alleen naam nodig heeft. `include: { items: true }` laadt alle regelitems terwijl
de lijst alleen het totaalbedrag toont.

**Actie:** Vervangen door `select` met minimale velden (zie PERF-01).

---

### PERF-04 · Ontbrekende database-index op `Expense.customerId`
**Bestand:** `prisma/schema.prisma` – model `Expense`

Het `Expense`-model heeft `@@index([userId])`, `@@index([date])`,
`@@index([category])`, `@@index([vendorId])`, maar **geen** `@@index([customerId])`.
Queries die kosten per klant filteren (doorbelaste kosten) doen een full table scan
op de Expense-tabel.

**Actie:**
```prisma
model Expense {
  // ...
  @@index([userId])
  @@index([date])
  @@index([category])
  @@index([vendorId])
  @@index([customerId])   // ← toevoegen
}
```
Daarna `npx prisma migrate dev`.

---

### UX-02 · Rate limit geeft geen tijdsindicatie aan gebruiker
**Bestanden:** `lib/rate-limit.ts`, `app/api/auth/check-2fa/route.ts:12-16`

Bij rate limiting krijgt de gebruiker een generieke melding ("Probeer het over 15
minuten opnieuw") zonder exacte wachttijd. De `RateLimitResult` bevat `resetAt`
maar dit wordt nergens teruggestuurd.

**Actie:** Voeg `Retry-After` header toe en geef de resterende seconden terug:
```ts
const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000)
return NextResponse.json(
  { error: `Te veel pogingen. Probeer het over ${retryAfterSec} seconden opnieuw.` },
  { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
)
```

---

### UX-03 · Verwijderacties hebben geen server-side bevestiging
**Bestanden:** `app/facturen/actions.ts`, `app/klanten/actions.ts`, `app/producten/actions.ts`

Delete-actions voeren direct de `db.*.delete()` uit na authenticatie. Er is geen
soft-delete of recovery-mechanisme. Per ongeluk verwijderde facturen zijn
onherstelbaar.

**Actie (gefaseerd):**
1. **Korte termijn:** Voeg een `isDeleted`/`deletedAt` soft-delete veld toe aan
   Invoice, Customer, en Product.
2. **Middellange termijn:** Implementeer een prullenbak-UI met hersteloptie
   (bijv. 30 dagen).

---

### UX-04 · Foutmeldingen bij import zijn niet actiegericht
**Bestand:** `app/api/import/upload/route.ts:80-84`

Wanneer het bestand leeg is of niet kan worden gelezen, geeft de route:
`"Bestand is leeg of kon niet worden gelezen"` – wat de gebruiker niet helpt.

**Actie:** Geef specifiekere berichten:
- Leeg bestand: "Het bestand bevat geen rijen. Controleer of het juiste blad is geselecteerd."
- Parsefout bij CSV: "Het CSV-bestand gebruikt mogelijk een onverwacht scheidingsteken. Gebruik komma of puntkomma."

---

## 🟢 P3 – Laag

### SEC-09 · Backup codes opgeslagen als JSON-string in één kolom
**Bestand:** `lib/auth-utils.ts:141-180`

Backup codes worden als SHA-256 hashes opgeslagen in `user.backupCodes` als een
JSON-string. Dit werkt correct maar heeft als nadeel dat alle 10 codes in één DB-veld
zitten. Een individuele code kan niet afzonderlijk worden geïndexeerd of
geanonimiseerd.

**Actie (optioneel):** Voeg een aparte `BackupCode`-tabel toe met
`(userId, codeHash, usedAt)`. Voordelen: individuele invalidatie, betere auditing,
makkelijker roteren.

---

### SEC-10 · `debug: true` in development lekt NextAuth-internals
**Bestand:** `lib/auth.ts:138`

```ts
debug: process.env.NODE_ENV === "development",
```

NextAuth logt bij `debug: true` JWT-inhoud en sessiedetails naar de console. In een
gedeelde dev-omgeving (bijv. remote dev container of CI) kan dit gevoelige data in
logs zetten.

**Actie:** Vervang door een expliciete flag:
```ts
debug: process.env.AUTH_DEBUG === "true",
```

---

### PERF-05 · `getInvoice()` laadt altijd de volledige gebruiker + bedrijf
**Bestand:** `app/facturen/actions.ts:46-60`

```ts
user: { include: { company: true } }
```

Dit is nodig voor PDF-generatie maar wordt ook aangeroepen bij de bewerkingspagina
waar `user.company` niet nodig is.

**Actie:** Splits `getInvoice()` in twee varianten:
- `getInvoice(id)` – zonder `user`-include, voor CRUD
- `getInvoiceForPdf(id)` – met volledige user+company, alleen voor PDF-endpoints

---

### UX-05 · CLAUDE.md documentatie klopt niet met implementatie
**Bestand:** `CLAUDE.md:72`

CLAUDE.md vermeldt `"FREE: 50/month"` maar de implementatie gebruikt `FREE_LIMIT = 5`
(`lib/stripe/subscriptions.ts:203`). De UI toont correct "Tot 5 facturen/maand".

**Actie:** Update CLAUDE.md:
```
- `canCreateInvoice(userId)` - Check invoice limits (FREE: 5/month)
```

---

### UX-06 · Geen health-check endpoint voor monitoring
**Actie:** Voeg `app/api/health/route.ts` toe:
```ts
export async function GET() {
  await db.$queryRaw`SELECT 1`
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```
Gebruik dit in uptime monitoring (Vercel, Better Uptime, etc.).

---

## Samenvatting

| Prioriteit | Aantal | Categorieën |
|-----------|--------|-------------|
| 🔴 P0 Kritiek | 3 | 2× SEC, 1× SEC |
| 🟠 P1 Hoog | 5 | 2× SEC, 2× PERF, 1× UX |
| 🟡 P2 Middel | 6 | 3× SEC, 2× PERF, 1× UX + 2× UX extra |
| 🟢 P3 Laag | 6 | 2× SEC, 2× PERF, 2× UX |
| **Totaal** | **20** | |

**Aanbevolen volgorde voor eerste sprint:**
1. SEC-01 (login rate limit bypass)
2. SEC-02 + SEC-03 (export/import feature gate)
3. PERF-01 (factuurlijst paginering – direct merkbaar voor eindgebruikers)
4. SEC-04 (audit log rol-wijziging)
5. SEC-05 (bestandsupload magic bytes)
