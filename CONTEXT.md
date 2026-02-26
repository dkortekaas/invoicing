# CONTEXT.md

Snelle referentie voor Claude Code om nieuwe code te schrijven die aansluit op bestaande patronen.

---

## 1. Tech Stack

| Onderdeel | Versie / Keuze |
|---|---|
| Framework | Next.js **16.1.3**, App Router |
| Runtime | React 19 |
| Taal | TypeScript **5.9.3**, strict mode |
| Styling | Tailwind CSS **4**, `tailwind-merge` + `clsx` via `cn()` |
| ORM | Prisma **7** met `@prisma/adapter-pg` (PostgreSQL via `pg`) |
| Auth | NextAuth.js **v5 beta** (`next-auth@^5.0.0-beta.30`), credentials provider + optionele 2FA |
| UI components | **shadcn/ui** (Radix UI primitives), config in `components.json` |
| Test framework | **Vitest** (`vitest run` / `vitest`) |
| Deployment | Vercel (Blob storage, serverless functions) |
| Email | Resend API + React Email |
| PDF | `@react-pdf/renderer` |
| Payments | Stripe + Mollie (payment links) |
| OCR | Anthropic Claude Vision API (`@anthropic-ai/sdk`) |
| Forms | React Hook Form + Zod v4 |
| Charts | Recharts |
| State / fetching | TanStack Query v5 (client-side) |

---

## 2. Projectstructuur

```
/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Publieke auth pagina's (login, register)
│   ├── (marketing)/            # Marketing + pricing pagina's
│   ├── admin/                  # SUPERUSER-only dashboard
│   ├── facturen/               # Facturen CRUD + actions.ts
│   ├── klanten/                # Klanten CRUD + actions.ts
│   ├── producten/              # Producten CRUD + actions.ts
│   ├── creditnotas/            # Credit nota's
│   ├── kosten/                 # Kostenregistratie + OCR
│   ├── leveranciers/           # Leveranciersbeheer
│   ├── offertes/               # Offertes
│   ├── tijd/                   # Tijdregistratie (PRO)
│   ├── btw/                    # BTW-aangifte (PRO)
│   ├── abonnementen/           # Terugkerende facturen (PRO)
│   ├── dashboard/              # Analytics (PRO)
│   ├── activa/                 # Vaste activa
│   ├── belasting/              # Belastingrapportage
│   ├── instellingen/           # Instellingen (import/export, etc.)
│   ├── klantportaal/           # Klantportaal (publiek)
│   ├── pay/                    # Betaallinks (publiek)
│   ├── sign/                   # Offerte ondertekening (publiek)
│   └── api/                    # Route handlers
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── invoices/           # GET/POST + [id]/ PATCH/DELETE
│       ├── customers/          # GET/POST + [id]/
│       ├── expenses/           # GET/POST + [id]/
│       ├── creditnotes/        # GET/POST + [id]/
│       ├── quotes/             # GET/POST + [id]/
│       ├── recurring/          # GET/POST + [id]/
│       ├── time/               # entries, start, stop, running
│       ├── export/             # invoices, customers, products, expenses, time-entries
│       ├── import/             # upload, [jobId], execute, status
│       ├── ocr/extract/        # OCR receipt extractie
│       ├── stripe/             # checkout, portal, webhook, subscription
│       ├── mollie/webhook/     # Mollie betalingen
│       ├── vat/report/         # BTW-rapport
│       ├── tax/report/         # Belastingrapport
│       ├── analytics/          # kpis, trends, customers
│       ├── cron/               # generate-recurring, send-reminders, sync-exchange-rates
│       └── admin/              # users, discount-codes, watermark
│
├── components/
│   ├── ui/                     # shadcn/ui basiscomponenten
│   ├── invoices/               # Factuur-specifieke componenten
│   ├── customers/              # Klant-specifieke componenten
│   ├── products/               # Product-specifieke componenten
│   ├── creditnotes/            # Credit nota componenten
│   ├── expenses/               # Kostenformulier + OCR preview
│   ├── quotes/                 # Offerte componenten
│   ├── recurring/              # Terugkerende facturen componenten
│   ├── vendors/                # Leveranciersbeheer formulier
│   ├── time/                   # Tijdregistratie componenten
│   ├── analytics/              # Charts en KPI-kaarten
│   ├── subscription/           # Feature gating UI
│   ├── import-export/          # Export button, modal, import wizard
│   ├── admin/                  # Admin dashboard componenten
│   ├── auth/                   # Login/register formulieren
│   ├── email/                  # E-mail preview componenten
│   ├── assets/                 # Vaste activa componenten
│   ├── audit/                  # Audit log componenten
│   ├── dashboard/              # Dashboard widgets
│   ├── currency/               # Valuta componenten
│   ├── vat/                    # BTW componenten
│   ├── marketing/              # Marketing pagina componenten
│   ├── payments/               # Betaling componenten
│   ├── pricing/                # Prijspagina componenten
│   └── providers/              # Context providers (QueryClient, etc.)
│
├── lib/                        # Server-side utilities
│   ├── auth.ts                 # NextAuth configuratie + export { auth, signIn, signOut }
│   ├── auth-utils.ts           # 2FA helpers
│   ├── db.ts                   # Prisma client (lazy-init proxy)
│   ├── server-utils.ts         # getCurrentUserId()
│   ├── get-session.ts          # getSession(), getCurrentUser(), getUserId(), requireAuth()
│   ├── validations.ts          # Zod schemas (Dutch foutmeldingen)
│   ├── utils.ts                # cn(), formatCurrency(), formatDate(), generateInvoiceNumber()
│   ├── company-guard.ts        # ensureCompanyDetails(), requireCompanyDetails()
│   ├── auth/
│   │   ├── admin-guard.ts      # requireSuperuser(), requireAdmin(), isSuperuser()
│   │   └── subscription-guard.ts # requireFeature(), hasFeatureAccess(), canCreateInvoice()
│   ├── stripe/                 # Stripe client + subscriptions
│   ├── mollie/                 # Mollie client + betalingen
│   ├── pdf/                    # PDF generatie + watermark
│   ├── email/                  # Resend e-mail verzending
│   ├── ocr/                    # Claude Vision OCR service
│   ├── categorization/         # Auto-categorisatie: vendor-matcher, classifier, learning-service
│   ├── import-export/          # Import/export services
│   ├── vat/                    # BTW berekeningen
│   ├── tax/                    # Belastingberekeningen
│   ├── currency/               # Multi-valuta + wisselkoersen
│   ├── time/                   # Tijdregistratie helpers
│   ├── recurring/              # Terugkerende facturen logica
│   ├── analytics/              # Analytics queries
│   ├── audit/                  # Audit logging helpers
│   ├── quotes/                 # Offerte helpers
│   └── rate-limit.ts           # Rate limiting (Upstash Redis)
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── types/
│   ├── index.ts                # Gedeelde TypeScript types
│   └── next-auth.d.ts          # NextAuth type augmentaties
│
├── hooks/                      # React client-side hooks
├── emails/                     # React Email templates
│   └── components/             # Herbruikbare e-mail componenten
├── __tests__/                  # Vitest unit tests
├── content/blog/               # Blog posts (markdown)
├── messages/                   # i18n berichten
└── scripts/                    # Build scripts
```

---

## 3. Auth Patroon

### Server Components & Server Actions

```ts
// lib/server-utils.ts
import { getUserId } from "./get-session"

export async function getCurrentUserId() {
  return await getUserId() // gooit Error("Niet ingelogd") als niet ingelogd
}

// Gebruik in Server Action (app/facturen/actions.ts):
const userId = await getCurrentUserId()
```

```ts
// lib/get-session.ts
import { auth } from "@/lib/auth"

export async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Niet ingelogd")
  return session.user.id
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}
```

### API Route Handlers

```ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // session.user.id is now available
}
```

### Middleware

Geen expliciete `middleware.ts`; routebescherming gebeurt via guards in Server Components/Actions:
- `requireAuth()` → redirect naar `/login`
- `requireSuperuser()` → redirect naar `/` (lib/auth/admin-guard.ts)
- `requireFeature(userId, feature)` → redirect naar `/upgrade` (lib/auth/subscription-guard.ts)

---

## 4. API Response Patroon

Geen custom helper; directe `NextResponse.json()` in alle route handlers.

```ts
// Succes
return NextResponse.json(data)
return NextResponse.json(data, { status: 201 })

// Fout
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
return NextResponse.json({ error: 'Failed to get expenses' }, { status: 500 })
```

Authenticatiecheck altijd bovenaan handler:
```ts
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Bedrijfsgegevenscheck (waar van toepassing):
```ts
if (!(await ensureCompanyDetails(session.user.id))) {
  return NextResponse.json(
    { error: 'Vul eerst je bedrijfsgegevens in via Instellingen > Bedrijfsgegevens.' },
    { status: 403 }
  )
}
```

---

## 5. Bestaande Prisma Modellen

### User
```
id, email (unique), name, passwordHash
vatNumber, kvkNumber, iban, invoicePrefix (default "FAC")
twoFactorEnabled, twoFactorSecret
role: UserRole (USER | ADMIN | SUPERUSER)
subscriptionStatus: SubscriptionStatus (FREE | ACTIVE | TRIALING | PAST_DUE | CANCELED)
subscriptionTier: SubscriptionTier (FREE | PRO | STARTER | PROFESSIONAL | BUSINESS)
stripeCustomerId, stripeSubscriptionId, stripeCurrentPeriodEnd
isManualSubscription, manualSubscriptionExpiresAt
defaultHourlyRate, roundingInterval
sessionVersion (incrementing, invalideert JWT-sessies bij rolwijziging)
→ relation: company (Company), invoices, customers, expenses, ...
```

### Customer
```
id, userId
name, companyName?, email, phone?
address, city, postalCode, country (default "Nederland")
vatNumber?, vatCountry?
paymentTermDays (default 30), notes?
currencyId? → Currency
→ relations: invoices, creditNotes, quotes, expenses, projects, timeEntries, recurringInvoices
```

### Invoice
```
id, userId, customerId
invoiceNumber (uniek per user), invoiceDate, dueDate
status: InvoiceStatus enum

  enum InvoiceStatus {
    DRAFT      // Concept
    SENT       // Verzonden
    PAID       // Betaald
    OVERDUE    // Achterstallig
    CANCELLED  // Geannuleerd
  }

subtotal, vatAmount, total (Decimal 10,2)
currencyCode (default "EUR"), currencyId?, exchangeRate?, exchangeRateLocked
subtotalEur?, vatAmountEur?, totalEur? (voor BTW-aangifte)
reference?, notes?, internalNotes?
pdfPath?, sentAt?, paidAt?, deletedAt? (soft-delete)
emailsSentCount, lastEmailSentAt
recurringInvoiceId?, paymentLinkToken?, paymentLinkExpiresAt?
→ relations: items (InvoiceItem[]), emails (EmailLog[]), payments (Payment[]), creditNotes (CreditNote[])
```

### CreditNote
```
id, userId, customerId
creditNoteNumber (unique), creditNoteDate
status: CreditNoteStatus enum

  enum CreditNoteStatus {
    DRAFT      // Concept
    FINAL      // Definitief (vergrendeld)
    SENT       // Verzonden
    PROCESSED  // Verwerkt
    REFUNDED   // Terugbetaald
  }

reason: CreditNoteReason (PRICE_CORRECTION | QUANTITY_CORRECTION | DUPLICATE | SERVICE_NOT_DELIVERED | OTHER)
originalInvoiceId?, originalInvoiceNumber?
subtotal, vatAmount, total (Decimal 10,2)
currencyCode (default "EUR"), currencyId?, exchangeRate?
subtotalEur?, vatAmountEur?, totalEur?
description?, notes?
→ relations: items (CreditNoteItem[]), emails (CreditNoteEmailLog[])
```

### Overige relevante modellen
- `InvoiceItem` / `CreditNoteItem`: quantity, description, unitPrice, vatRate, total
- `Payment`: invoiceId, amount, method, molliePaymentId, status
- `Expense`: userId, date, description, category (ExpenseCategory enum), amount, vatAmount, vatRate, netAmount, supplier, deductible, vendorId?, categorySource, wasAutoCategorized
- `RecurringInvoice`: status (RecurringStatus), frequency (RecurringFrequency), nextInvoiceDate
- `TimeEntry`: userId, customerId?, projectId?, startTime, endTime, duration, hourlyRate, amount
- `Quote`: status (QuoteStatus: DRAFT | SENT | ACCEPTED | REJECTED | EXPIRED)
- `Vendor`, `ExpenseTrainingData`: voor auto-categorisatie

---

## 6. Bestaande Component Conventies

Alle shadcn/ui basiscomponenten in `components/ui/`:

| Component type | Bestandspad |
|---|---|
| Button | `components/ui/button.tsx` |
| Modal / Dialog | `components/ui/dialog.tsx` |
| Sheet (slide-over) | `components/ui/sheet.tsx` |
| Dropdown | `components/ui/dropdown-menu.tsx` |
| Select | `components/ui/select.tsx` |
| Toast / Sonner | `components/ui/sonner.tsx` (gebruikt `sonner` package) |
| Form | `components/ui/form.tsx` (React Hook Form wrappers) |
| Input | `components/ui/input.tsx` |
| Textarea | `components/ui/textarea.tsx` |
| Toggle / Switch | `components/ui/switch.tsx` |
| Skeleton | `components/ui/skeleton.tsx` |
| Table | `components/ui/table.tsx` |
| Badge | `components/ui/badge.tsx` |
| Card | `components/ui/card.tsx` |
| Tabs | `components/ui/tabs.tsx` |
| Checkbox | `components/ui/checkbox.tsx` |
| Radio Group | `components/ui/radio-group.tsx` |
| Popover | `components/ui/popover.tsx` |
| Calendar | `components/ui/calendar.tsx` (react-day-picker) |
| Tooltip | `components/ui/tooltip.tsx` |
| Progress | `components/ui/progress.tsx` |
| Accordion | `components/ui/accordion.tsx` |
| Separator | `components/ui/separator.tsx` |
| Sidebar | `components/ui/sidebar.tsx` |
| Sortable table head | `components/ui/sortable-table-head.tsx` |
| Pagination | `components/ui/pagination.tsx` |

**Domain-specifieke formuliercomponenten** volgen het patroon `components/{domain}/{domain}-form.tsx`, bijv. `components/invoices/invoice-form.tsx`.

**Toast** aanroepen via `import { toast } from 'sonner'`:
```ts
toast.success("Factuur aangemaakt")
toast.error("Er is iets misgegaan")
```

---

## 7. Environment Variables

```env
# Database
DATABASE_URL=

# Auth (NextAuth v5)
AUTH_SECRET=
NEXTAUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_YEARLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_YEARLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_YEARLY=
# Legacy (mapped to PROFESSIONAL):
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=

# Mollie (betalingen)
MOLLIE_ENCRYPTION_KEY=

# Anthropic (OCR)
ANTHROPIC_API_KEY=

# Vercel Blob (bestandsuploads productie)
BLOB_READ_WRITE_TOKEN=

# Resend (e-mail)
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=

# App URL
NEXT_PUBLIC_APP_URL=

# Google Analytics (optioneel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron beveiliging
CRON_SECRET=
NEXT_PUBLIC_CRON_SECRET=

# Debug (optioneel)
AUTH_DEBUG=
```

---

## 8. Naamgevingsconventies

### Bestanden en mappen
- **Componenten**: PascalCase bestandsnaam (`InvoiceForm.tsx`) — _uitzondering_: shadcn/ui volgt kebab-case (`components/ui/dropdown-menu.tsx`)
- **Domeincomponenten**: kebab-case (`invoice-form.tsx`, `customer-table.tsx`)
- **Route handlers**: altijd `route.ts` in de map met de routenaam
- **Server Actions**: altijd `actions.ts` naast de paginabestanden
- **Lib utilities**: kebab-case (`server-utils.ts`, `auth-utils.ts`, `company-guard.ts`)

### Code
- **Variabelen en functies**: camelCase (`getUserId`, `getCurrentUserId`, `formatCurrency`)
- **Componenten en types**: PascalCase (`InvoiceForm`, `InvoiceStatus`, `CustomerWithInvoices`)
- **Prisma enum waarden**: UPPER_SNAKE_CASE (`DRAFT`, `SENT`, `PAID`, `SUPERUSER`)
- **Zod schemas**: camelCase met `Schema`-suffix (`invoiceSchema`, `customerSchema`)
- **Server Actions**: camelCase werkwoord + zelfstandig naamwoord (`createInvoice`, `updateCustomer`, `deleteExpense`)
- **API route exports**: HTTP-methode als naam (`GET`, `POST`, `PATCH`, `DELETE`)

### Import alias
- `@/` verwijst naar de project root (geconfigureerd in `tsconfig.json` en `vitest.config.ts`)
- Gebruik altijd `@/` in plaats van relatieve paden voor imports buiten dezelfde map
