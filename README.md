# Declair

Een professionele facturatie web applicatie voor Nederlandse ZZP-ers en kleine bedrijven. Maak, beheer en verstuur facturen met volledige BTW-ondersteuning en Nederlandse factuurvereisten.

## ✨ Features

- 📄 **Facturen beheren**: Maak, bewerk en beheer facturen met automatische nummering
- 👁️ **Factuur Preview**: Bekijk een live preview van je factuur voordat je deze verzendt
- 📝 **Credit Nota's**: Volledige credit nota functionaliteit met status workflow
- 👥 **Klantenbeheer**: Beheer je klantenbestand met volledige contactgegevens
- 📦 **Producten & Diensten**: Definieer herbruikbare producten en diensten
- 💰 **BTW-berekening**: Automatische BTW-berekening voor 0%, 9% en 21% tarieven
- 📊 **Dashboard**: Overzicht van openstaande facturen, omzet en statistieken
- 📈 **Analytics & BI Dashboard**: Compleet business intelligence dashboard met KPI tracking, trends, en visualisaties
- 📑 **PDF Export**: Professionele PDF facturen met alle vereiste gegevens
- 📊 **Excel Export**: Exporteer analytics data naar Excel voor verdere analyse
- 🖼️ **Bedrijfslogo**: Upload je bedrijfslogo voor gebruik op facturen
- 🔐 **Authenticatie**: Veilige authenticatie met NextAuth.js v5
- 🔒 **Twee-Factor Authenticatie (2FA)**: Extra beveiliging met TOTP authenticatie
- ⏱️ **Time Tracking**: Track tijd per project en klant
- 🔄 **Recurring Invoices**: Automatische terugkerende facturen
- 📧 **Email Systeem**: Verstuur facturen en herinneringen via email
- 💧 **Watermerk Systeem**: Configureerbaar watermerk op PDF facturen voor free users
- 👑 **Admin Dashboard**: Superuser dashboard voor systeembeheer en gebruikersbeheer
- 💳 **Stripe Abonnementen**: Volledig geïntegreerd subscription systeem met feature gating
- 🎯 **Free & Pro Plans**: Gratis plan met basis features, Pro plan met premium functionaliteiten
- 🔒 **Feature Gating**: Automatische toegangscontrole voor premium features
- 📧 **User Invitations**: PRO accounts kunnen extra gebruikers uitnodigen
- 🏠 **Marketing Homepage**: Professionele marketing homepage met features, pricing en smooth scrolling
- 📋 **Audit Trail Systeem**: Compleet audit logging systeem met fraud detectie en compliance features
- 🇳🇱 **Nederlandse standaarden**: Volledig aangepast aan Nederlandse factuurvereisten
- 📥 **Import/Export**: Importeer en exporteer klanten, facturen, producten, onkosten en tijdregistraties via CSV/Excel
- 🎨 **Modern UI**: Gebouwd met Next.js 16, React 19, Tailwind CSS en shadcn/ui

## 🛠️ Technische Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **Database**: PostgreSQL met Prisma ORM
- **Forms**: React Hook Form + Zod validatie
- **PDF**: @react-pdf/renderer
- **Charts**: Recharts voor data visualisatie
- **Excel Export**: ExcelJS voor analytics export
- **Data Fetching**: Server Actions
- **Payments**: Stripe voor subscription management

## 📋 Vereisten

- Node.js 18+ 
- PostgreSQL database
- npm, yarn, pnpm of bun

## 🚀 Installatie

### 1. Clone het project

```bash
git clone <repository-url>
cd invoicing
```

### 2. Installeer dependencies

```bash
npm install
# of
yarn install
# of
pnpm install
```

### 3. Configureer environment variables

Maak een `.env` bestand in de root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/invoices"
```

**Voorbeeld PostgreSQL connection string:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/invoice_app?schema=public"
```

**Voor productie databases met SSL:**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=verify-full"
```

**Nota:** Als je een SSL waarschuwing ziet, voeg `&sslmode=verify-full` toe aan je `DATABASE_URL` voor de huidige veilige gedrag, of gebruik `&uselibpqcompat=true&sslmode=require` voor libpq compatibiliteit.

### 4. Database setup

Run de Prisma migraties om de database schema aan te maken:

```bash
npx prisma migrate dev
```

Dit zal:
- De database schema aanmaken
- De Prisma Client genereren
- Een initiële migratie uitvoeren

**Voor het watermerk systeem:**
```bash
npx prisma migrate dev --name add_watermark_system
npx prisma generate
npx prisma db seed
```

**Voor het subscription systeem:**
```bash
npx prisma migrate dev --name add_subscriptions
npx prisma generate
```

Dit zal:
- De subscription velden toevoegen aan de User tabel
- De SubscriptionEvent tabel aanmaken
- De benodigde enums toevoegen (SubscriptionStatus, SubscriptionTier, BillingCycle, etc.)

**Voor user invitations:**
```bash
npx prisma migrate dev --name add_user_invitations
npx prisma generate
```

Dit zal:
- De Invitation tabel aanmaken
- De InvitationStatus enum toevoegen
- Relaties tussen User en Invitation aanmaken

### 5. Start de development server

```bash
npm run dev
# of
yarn dev
# of
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## 📁 Project Structuur

```
/app
  (marketing)            # Marketing pages (publiek toegankelijk)
    page.tsx             # Marketing homepage
    layout.tsx           # Marketing layout met header/footer
  /dashboard             # Analytics & BI dashboard
    page.tsx             # Analytics dashboard met KPI's en grafieken
  /facturen              # Facturen beheer
    page.tsx             # Facturen lijst
    /[id]                # Factuur detail
    /nieuw               # Nieuwe factuur
    actions.ts           # Server actions
  /creditnotas           # Credit nota's beheer
    page.tsx             # Credit nota's lijst
    /[id]                # Credit nota detail
    /[id]/bewerken       # Credit nota bewerken
    /nieuw               # Nieuwe credit nota
    /van-factuur/[id]    # Credit nota van factuur
    actions.ts           # Server actions
  /klanten               # Klanten beheer
  /producten             # Producten beheer
  /instellingen          # Bedrijfsinstellingen
  /tijd                  # Time tracking
  /abonnementen          # Recurring invoices
  /abonnement            # Subscription management
  /upgrade               # Upgrade to Pro plan
  /prijzen               # Pricing page (publiek)
  /btw                   # BTW rapportage
  /uitnodiging/[token]   # Invitation accept page
  /admin                 # Admin dashboard (superuser only)
    page.tsx             # Admin overzicht
    /watermark           # Watermerk instellingen
    /users               # Gebruikersbeheer
    /subscriptions       # Abonnementen overzicht
  /instellingen
    /import-export       # Import/export pagina
      page.tsx           # Import/export hub
      import-export-page.tsx
  /api
    /admin               # Admin API endpoints
      /watermark         # Watermerk settings API
      /users/[id]/role  # User role management API
      /check             # Admin check API
    /invitations         # User invitations API
      route.ts           # List/create invitations
      /[id]              # Cancel invitation
      /accept            # Accept invitation
      /validate/[token]  # Validate invitation token
    /analytics           # Analytics API endpoints
      /kpis              # KPI berekeningen
      /trends            # Trend analyse
      /customers         # Klant analyse
      /export            # Excel export
    /stripe              # Stripe API endpoints
      /checkout          # Create checkout session
      /portal             # Billing portal session
      /webhook            # Stripe webhooks
      /subscription       # Subscription status
    /invoices/[id]/pdf   # PDF generatie endpoint
    /export              # Export API endpoints
      /customers         # Klanten export
      /invoices          # Facturen export
      /products          # Producten export
      /expenses          # Onkosten export
      /time-entries      # Tijdregistraties export
      /template/[entityType]  # Template downloads
    /import              # Import API endpoints
      /upload            # Bestand upload
      /[jobId]/validate  # Validatie
      /[jobId]/execute   # Import uitvoeren
      /[jobId]/status    # Import status
    /creditnotes         # Credit nota API endpoints
      /[id]/pdf          # Credit nota PDF generatie
      /email             # Credit nota email verzenden
/components
  /ui                    # shadcn/ui components
  /marketing             # Marketing components
    header.tsx           # Marketing header met smooth scroll
    footer.tsx           # Marketing footer
    hero.tsx             # Hero sectie
    features.tsx         # Features sectie
    problem-solution.tsx # Problem/solution sectie
    how-it-works.tsx     # How it works sectie
    call-to-action.tsx   # CTA component
  /dashboard             # Dashboard components
  /analytics             # Analytics chart components
    kpi-card.tsx         # KPI display cards
    revenue-chart.tsx    # Omzet trends grafiek
    customer-chart.tsx   # Top klanten distributie
    cashflow-chart.tsx   # Cashflow visualisatie
    goals-progress.tsx   # Doelstellingen tracking
    period-selector.tsx  # Datum range selector
  /invoices              # Factuur components
  /creditnotes           # Credit nota components
    credit-note-form.tsx           # Credit nota formulier
    credit-note-status-badge.tsx   # Status badge component
    credit-note-pdf-template.tsx   # PDF template
    credit-note-email-send-button.tsx  # Email versturen button
  /customers             # Klant components
  /products              # Product components
  /import-export         # Import/export components
    export-modal.tsx     # Export dialog
    import-wizard.tsx    # 4-stappen import wizard
  /admin                 # Admin components
    invitation-manager.tsx      # Invitation management UI
    invitation-accept-form.tsx  # Invitation accept form
    subscription-manager.tsx    # Subscription overview
  /lib
  /import-export         # Import/export library
    types.ts             # Type definities
    export-service.ts    # Export logica
    import-service.ts    # Import logica
    /fields              # Veld definities per entiteit
      customers.ts
      invoices.ts
      products.ts
      expenses.ts
      time-entries.ts
  /analytics             # Analytics library
    kpis.ts              # KPI berekeningen
    trends.ts            # Trend analyse
    comparisons.ts       # Periode vergelijkingen
    export.ts            # Excel export utilities
  /auth                  # Authentication utilities
    admin-guard.ts       # Admin/superuser permission checks
    subscription-guard.ts # Subscription feature guards
  /stripe                # Stripe integration
    client.ts             # Stripe client setup
    subscriptions.ts      # Subscription utilities & feature checks
    webhooks.ts           # Webhook handlers
  /pdf                   # PDF utilities
    watermark.ts         # Watermark rendering logic
  /invitations           # Invitation utilities
    utils.ts             # Invitation token generation & validation
  db.ts                  # Prisma client
  validations.ts         # Zod schemas
  utils.ts              # Helper functions
/components
  /admin                 # Admin components
    watermark-settings-form.tsx  # Watermark configuration form
    watermark-preview.tsx         # Live watermark preview
    user-role-manager.tsx        # User role management
    admin-tabs.tsx               # Admin navigation tabs
  /subscription           # Subscription components
    pricing-card.tsx             # Pricing display card
    upgrade-banner.tsx           # Upgrade CTA banner
    feature-locked.tsx           # Locked feature modal
    usage-meter.tsx              # Usage tracking display
    billing-portal-button.tsx    # Manage subscription button
/prisma
  schema.prisma          # Database schema
```

## 🗄️ Database Schema

De applicatie gebruikt de volgende hoofdmodellen:

- **User**: Bedrijfsgegevens en instellingen
- **Customer**: Klantgegevens
- **Product**: Producten en diensten
- **Invoice**: Facturen met items
- **InvoiceItem**: Factuurregels
- **CreditNote**: Credit nota's met status workflow
- **CreditNoteItem**: Credit nota regels
- **CreditNoteEmailLog**: Email geschiedenis voor credit nota's
- **Project**: Projecten voor time tracking
- **TimeEntry**: Tijd registraties
- **RecurringInvoice**: Terugkerende facturen
- **Expense**: Uitgaven/kosten
- **VATReport**: BTW rapporten
- **BusinessGoal**: Doelstellingen voor analytics
- **AnalyticsSnapshot**: Dagelijkse analytics snapshots
- **SystemSettings**: Systeeminstellingen (watermerk configuratie)
- **SubscriptionEvent**: Subscription events voor audit trail
- **Invitation**: User invitations (voor PRO accounts)
- **UserRole**: Gebruikersrollen (USER, ADMIN, SUPERUSER)
- **SubscriptionStatus**: Subscription status (FREE, ACTIVE, TRIALING, etc.)
- **SubscriptionTier**: Subscription tier (FREE, PRO)
- **InvitationStatus**: Invitation status (PENDING, ACCEPTED, EXPIRED, CANCELLED)
- **ImportExportJob**: Import/export jobs met progress tracking
- **ImportTemplate**: Opgeslagen kolom mappings voor hergebruik
- **ImportExportJobStatus**: Job status (PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED, CANCELLED)

Zie `prisma/schema.prisma` voor het volledige schema.

## 🎯 Gebruik

### Eerste Setup

1. **Registreer een account**
   - Bezoek de homepage (`/`)
   - Klik op "Start gratis!" in de header
   - Vul je gegevens in en maak een account aan

2. **Profiel instellen**
   - Ga naar Instellingen → Profiel
   - Vul je naam en email in
   - Sla op

3. **Bedrijfsgegevens instellen**
   - Ga naar Instellingen → Bedrijfsgegevens
   - Vul je bedrijfsgegevens in (naam, adres, postcode, stad, land, telefoon)
   - Upload je bedrijfslogo (optioneel, wordt getoond op facturen)
   - Sla op

4. **Financiële gegevens instellen**
   - Ga naar Instellingen → Financiële gegevens
   - Vul je BTW-nummer, KvK-nummer en IBAN in
   - Pas je factuur prefix aan indien gewenst
   - Sla op

5. **Klanten toevoegen**
   - Ga naar Klanten
   - Klik op "Nieuwe Klant"
   - Vul klantgegevens in

6. **Producten/Diensten toevoegen** (optioneel)
   - Ga naar Producten
   - Voeg je standaard producten of diensten toe
   - Deze kunnen snel worden toegevoegd aan facturen

### Factuur Maken

1. Ga naar **Facturen** → **Nieuwe Factuur**
2. Selecteer een klant
3. Voeg factuurregels toe:
   - Handmatig invoeren, of
   - Selecteer een product uit je productenlijst
4. Pas aantal, prijs en BTW-tarief aan indien nodig
5. Voeg optionele referentie en notities toe
6. Kies:
   - **Opslaan als Concept**: Bewaar voor later
   - **Opslaan en Verzenden**: Markeer direct als verzonden

### Factuur Beheren

- **Bekijken**: Klik op een factuur in de lijst
- **Preview**: Bekijk een live preview van de PDF via de "Preview" tab
- **Bewerken**: Klik op "Bewerken" in het factuur detail
- **PDF Downloaden**: Klik op "Download PDF" in het factuur detail of via het dropdown menu
- **Status wijzigen**:
  - Concept → Verzonden
  - Verzonden → Betaald
- **Verwijderen**: Via dropdown menu (alleen concept facturen)
- **Crediteren**: Maak een credit nota aan voor de factuur

### Credit Nota's

Credit nota's zijn wettelijk verplicht voor het corrigeren van facturen. De applicatie biedt volledige ondersteuning voor:

#### Credit Nota Maken
1. Ga naar **Credit Nota's** → **Nieuwe Credit Nota**, of
2. Vanaf een factuur: klik op "Crediteren" in het factuur detail

#### Credit Nota Workflow
- **CONCEPT**: Credit nota kan worden bewerkt en verwijderd
- **DEFINITIEF**: Credit nota is vergrendeld, klaar voor verzending
- **VERZONDEN**: Credit nota is verzonden naar de klant
- **VERWERKT**: Credit nota is verwerkt in de administratie
- **TERUGBETAALD**: Bedrag is teruggestort aan de klant

#### Redenen voor Credit Nota's
- Prijscorrectie
- Aantalaanpassing
- Retour
- Annulering
- Korting achteraf
- BTW correctie
- Dubbele factuur
- Coulance
- Overig (met verplichte omschrijving)

#### Credit Nota's en BTW
Credit nota's worden automatisch verwerkt in de BTW-aangifte:
- Omzet wordt gecorrigeerd (afgetrokken)
- BTW wordt gecorrigeerd per tarief
- Integratie met ICP rapportage voor EU-klanten

### Dashboard

Het home dashboard toont:
- **Openstaand**: Totaalbedrag van verzonden en achterstallige facturen
- **Achterstallig**: Aantal en bedrag van achterstallige facturen
- **Omzet deze maand**: Totaal van betaalde facturen deze maand
- **Klanten**: Aantal klanten
- **Recente facturen**: Laatste 5 facturen

### Analytics Dashboard

Het analytics dashboard (`/dashboard`) biedt uitgebreide business intelligence:

#### KPI Cards
- **Omzet deze maand**: Met groei percentage vs vorige maand
- **Winst marge**: Percentage winst marge
- **Openstaand**: Totaal openstaand bedrag
- **Actieve klanten**: Klanten met activiteit in laatste 90 dagen
- **Gemiddelde betaaltermijn**: Gemiddeld aantal dagen tot betaling
- **Gemiddelde factuurwaarde**: Gemiddeld bedrag per factuur
- **Utilization Rate**: Percentage billable hours (indien time tracking gebruikt)
- **MRR/ARR**: Monthly/Annual Recurring Revenue (indien recurring invoices)

#### Visualisaties
- **Omzet Trends**: Maandelijkse omzet, kosten en winst (lijn/bar grafiek)
- **Top Klanten**: Distributie van omzet per klant (pie chart)
- **Cashflow**: Maandelijkse cashflow visualisatie (waterfall chart)
- **Doelstellingen**: Progress tracking voor ingestelde doelen

#### Functionaliteiten
- **Period Selector**: Filter op maand, kwartaal, jaar of custom date range
- **Excel Export**: Exporteer alle analytics data naar Excel
- **Responsive Design**: Volledig geoptimaliseerd voor mobile en desktop

#### Data Analyse
- Maandelijkse trends (tot 12 maanden)
- Top klanten analyse
- Periode vergelijkingen (MoM, QoQ, YoY)
- Real-time KPI berekeningen

## 🔧 Development

### Database Migraties

Maak een nieuwe migratie:
```bash
npx prisma migrate dev --name migration_name
```

**Voor analytics features:**
```bash
npx prisma migrate dev --name add_analytics
npx prisma generate
```

**Voor watermark systeem:**
```bash
npx prisma migrate dev --name add_watermark_system
npx prisma generate
npx prisma db seed
```

**Voor subscription systeem:**
```bash
npx prisma migrate dev --name add_subscriptions
npx prisma generate
```

**Voor audit trail systeem:**
```bash
npx prisma migrate dev --name add_audit_trail
npx prisma generate
```

Genereer Prisma Client (na schema wijzigingen):
```bash
npx prisma generate
```

Open Prisma Studio (database GUI):
```bash
npx prisma studio
```

### Build voor Productie

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📝 Nederlandse Factuurvereisten

De applicatie voldoet aan Nederlandse factuurvereisten:

- ✅ Uniek factuurnummer (automatisch gegenereerd: YYYY-0001)
- ✅ Factuurdatum en vervaldatum
- ✅ BTW-nummer (indien BTW-plichtig)
- ✅ KvK-nummer
- ✅ BTW specificatie per tarief (0%, 9%, 21%)
- ✅ Betalingstermijn
- ✅ IBAN voor betaling
- ✅ Nederlandse datum/bedrag formatting (dd-MM-yyyy, € 1.234,56)

## 🎨 Styling

De applicatie gebruikt:
- **Tailwind CSS 4** voor styling
- **shadcn/ui** voor UI componenten
- **CSS variables** voor theming
- **Responsive design** (mobile-first)

## 📋 Audit Trail Systeem

De applicatie heeft een compleet audit trail systeem voor volledige traceerbaarheid en compliance met Nederlandse fiscale vereisten.

### Functionaliteiten

#### Automatische Logging
- Alle CRUD operaties (CREATE, UPDATE, DELETE) worden automatisch gelogd
- Login/logout en mislukte login pogingen
- Financiële acties (betalingen, factuur verzending)
- Instellingen wijzigingen
- Export acties

#### Fraud Detectie
Het systeem detecteert automatisch verdachte patronen:
- **Buiten kantooruren**: Acties tussen 22:00 - 6:00
- **Bulk wijzigingen**: >10 wijzigingen in 5 minuten
- **Wijzigingen aan verzonden facturen**: Aanpassingen aan reeds verzonden of betaalde facturen
- **BTW-aangifte wijzigingen**: Wijzigingen aan ingediende BTW-aangiftes
- **Brute force**: ≥5 mislukte login pogingen in 15 minuten
- **Onbekende IP-adressen**: Acties vanaf nieuwe IP-adressen

#### Compliance Features
- **Immutable Logs**: Audit records kunnen NOOIT worden gewijzigd of verwijderd
- **Hash-Chain**: Elke log entry bevat een hash van de vorige entry voor tamper detection
- **Retention Policy**: Database is geoptimaliseerd voor 7+ jaar bewaartermijn (Nederlandse fiscale vereiste)
- **Export Functionaliteit**: Exporteer audit logs als CSV of JSON voor accountantscontrole
- **Digitale Handtekening**: Timestamp en hash-chain zorgen voor betrouwbare timestamp

#### UI Componenten
- **AuditLogViewer**: Chronologisch overzicht met filters en paginatie
- **RecentActivity**: Dashboard widget met recente activiteit
- **AuditAlerts**: Overzicht van verdachte activiteiten met samenvatting
- **Entity Timeline**: Bekijk de volledige geschiedenis van een specifieke entiteit

#### API Endpoints
- `GET /api/audit-logs` - Lijst met filters en paginatie
- `GET /api/audit-logs/entity/:type/:id` - Geschiedenis van specifiek record
- `GET /api/audit-logs/user/:id` - Alle acties van een gebruiker
- `GET /api/audit-logs/export` - Export voor accountant (CSV/JSON)
- `GET /api/audit-logs/alerts` - Verdachte activiteiten

### Gebruik

#### Audit Logs Bekijken
```typescript
// In een component
import { AuditLogViewer } from "@/components/audit/audit-log-viewer"

// Volledige audit log
<AuditLogViewer showFilters={true} />

// Entity-specifieke geschiedenis
<AuditLogViewer entityType="invoice" entityId={invoiceId} />
```

#### Recent Activity Widget
```typescript
import { RecentActivity } from "@/components/audit/recent-activity"

<RecentActivity limit={10} />
```

#### Alerts Component
```typescript
import { AuditAlerts } from "@/components/audit/audit-alerts"

<AuditAlerts days={7} />
```

### Database Schema

Het audit trail systeem gebruikt de `AuditLog` tabel met de volgende belangrijke velden:
- `timestamp`, `userId`, `userEmail` (snapshot voor verwijderde users)
- `action`, `entityType`, `entityId`
- `changes` (JSON met old/new values)
- `ipAddress`, `userAgent`, `sessionId`
- `previousHash`, `hash` (voor hash-chain integriteit)
- `isSuspicious`, `suspiciousReason`

Zie `AUDIT_TRAIL_IMPLEMENTATION.md` voor volledige documentatie.

## 💳 Subscription Systeem

De applicatie heeft een volledig geïntegreerd Stripe subscription systeem met feature gating.

### Abonnementen

#### Free Plan
- ✅ Basis facturen maken en versturen
- ✅ Klantenbeheer
- ✅ Productencatalogus
- ✅ PDF generatie
- ✅ Email notificaties (beperkt)
- ✅ Maximaal 50 facturen per maand
- ❌ Recurring invoices
- ❌ BTW rapportage
- ❌ Tijdregistratie
- ❌ Analytics dashboard
- ❌ Email integratie (onbeperkt)

#### Pro Plan (€19/maand of €190/jaar)
- ✅ Alles van Free
- ✅ Onbeperkt facturen
- ✅ Recurring invoices & abonnementen
- ✅ Volledige BTW rapportage
- ✅ Tijdregistratie & project tracking
- ✅ Analytics dashboard & rapporten
- ✅ Onbeperkte email verzending
- ✅ Automatische herinneringen
- ✅ Export functionaliteit (Excel/PDF)
- ✅ Prioriteit support
- ✅ **User Invitations**: Nodig extra gebruikers uit voor je account

### Stripe Setup

1. **Maak een Stripe account aan** op [stripe.com](https://stripe.com)

2. **Maak Products & Prices aan** in Stripe Dashboard:
   - Ga naar Products → Create product
   - Maak "Pro Plan - Monthly" (€19.00/month)
   - Maak "Pro Plan - Yearly" (€190.00/year)
   - Kopieer de Price IDs

3. **Configureer Webhooks**:
   - Ga naar Developers → Webhooks
   - Voeg endpoint toe: `https://yourdomain.com/api/stripe/webhook`
   - Selecteer events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Kopieer webhook secret

4. **Configureer Customer Portal**:
   - Ga naar Settings → Customer Portal
   - Enable: Edit subscription, Cancel subscription
   - Configureer branding

5. **Voeg environment variables toe**:
```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Subscription Management

- **Upgrade**: Bezoek `/upgrade` om naar Pro te upgraden
- **Beheer abonnement**: Ga naar `/abonnement` om je abonnement te beheren
- **Billing Portal**: Gebruik de "Beheer abonnement" knop om naar Stripe Customer Portal te gaan
- **Feature Gating**: Premium routes worden automatisch beschermd en redirecten naar upgrade pagina
- **User Invitations**: PRO accounts kunnen extra gebruikers uitnodigen via Admin → Gebruikers → Uitnodigingen tab
  - Verstuur uitnodigingen via email
  - Kopieer uitnodigingslinks
  - Bekijk status van alle uitnodigingen
  - Uitnodigingen verlopen na 7 dagen

### Feature Gating

Premium features zijn automatisch beschermd:
- `/abonnementen` - Recurring invoices
- `/btw` - BTW rapportage
- `/tijd` - Time tracking
- `/dashboard` - Analytics dashboard
- `/rapporten` - Reports

Free users worden automatisch doorgestuurd naar de upgrade pagina wanneer ze proberen premium features te gebruiken.

### Invoice Limits

- **Free users**: Maximaal 50 facturen per maand
- **Pro users**: Onbeperkt facturen
- Het systeem trackt automatisch het aantal facturen en reset maandelijks
- Gebruikers krijgen een waarschuwing wanneer ze hun limiet naderen

## 📥 Import/Export

De applicatie biedt uitgebreide import/export functionaliteit voor data migratie en backup.

### Ondersteunde Entiteiten
- **Klanten**: Naam, bedrijfsgegevens, contactinformatie, BTW-nummer
- **Facturen**: Factuurgegevens met klantverwijzing (alleen export)
- **Producten**: Producten en diensten met prijzen en BTW-tarieven
- **Onkosten**: Uitgaven met categorie en BTW-informatie
- **Tijdregistraties**: Urenregistratie met project- en klantverwijzing

### Export Functionaliteit
- Export naar **CSV** of **Excel** (.xlsx)
- Filter op datum, status of selectie
- Kies welke kolommen je wilt exporteren
- Nederlandse formatting (DD-MM-YYYY datums, komma als decimaal)
- UTF-8 encoding met BOM voor Excel compatibiliteit

### Import Functionaliteit
De import wizard begeleidt je in 4 stappen:

1. **Upload**: Sleep of selecteer een CSV/Excel bestand
2. **Kolom Mapping**: Automatische detectie van kolommen met handmatige aanpassing
3. **Validatie**: Bekijk fouten en waarschuwingen per rij
4. **Resultaat**: Overzicht van geïmporteerde, overgeslagen en mislukte rijen

#### Import Features
- **Auto-detectie**: Herkent automatisch Nederlandse kolomnamen (bijv. "bedrijfsnaam", "klantnaam")
- **Duplicaat detectie**: Sla bestaande records over of update ze
- **Template downloads**: Download lege templates per entiteit
- **Import historie**: Bekijk recente imports met status

### Export Knoppen
Export knoppen zijn beschikbaar op de volgende pagina's:
- `/klanten` - Klanten exporteren
- `/facturen` - Facturen exporteren
- `/producten` - Producten exporteren
- `/kosten` - Kosten exporteren
- `/tijd` - Tijdregistraties exporteren

### Instellingen Pagina
Bezoek `/instellingen/import-export` voor:
- Export kaarten per entiteit met recordaantallen
- Import wizard starten
- Template downloads
- Recente imports geschiedenis

## 🔐 Authenticatie

De applicatie gebruikt **NextAuth.js v5** met:
- Email/wachtwoord authenticatie
- Twee-factor authenticatie (2FA) met TOTP
- JWT-based sessies
- Wachtwoord wijzigen functionaliteit
- Role-based access control (USER, ADMIN, SUPERUSER)

### Eerste Gebruik

1. **Registreer een account**
   - Ga naar `/register`
   - Vul je gegevens in (naam, email, wachtwoord, bedrijfsgegevens)
   - Maak je account aan

2. **Log in**
   - Ga naar `/login`
   - Log in met je email en wachtwoord
   - Als 2FA is ingeschakeld, voer je 6-cijferige code in

3. **2FA instellen** (optioneel maar aanbevolen)
   - Ga naar Instellingen → Beveiliging
   - Klik op "2FA inschakelen"
   - Scan de QR code met je authenticator app (Google Authenticator, Authy, etc.)
   - Verifieer met een code
   - Sla je backup codes op op een veilige plek

## 👑 Admin Dashboard & Watermerk Systeem

### Superuser Setup

Om toegang te krijgen tot het admin dashboard, moet je eerst een superuser account aanmaken:

**Via SQL:**
```sql
UPDATE "User" SET role = 'SUPERUSER' WHERE email = 'your@email.com';
```

**Via Prisma Studio:**
1. Open Prisma Studio: `npx prisma studio`
2. Navigeer naar de User tabel
3. Zoek je gebruiker
4. Wijzig de `role` veld naar `SUPERUSER`

### Admin Dashboard Features

Het admin dashboard (`/admin`) is alleen toegankelijk voor superusers en biedt:

#### 1. Admin Overzicht (`/admin`)
- Totaal aantal gebruikers
- Totaal aantal facturen
- Watermerk status

#### 2. Watermerk Instellingen (`/admin/watermark`)
Configureer het watermerk dat wordt getoond op PDF facturen van gratis gebruikers:

- **Watermerk Enabled**: Schakel watermerk functionaliteit in/uit
- **Watermerk voor Free Users**: Toon watermerk alleen voor free users
- **Watermerk Tekst**: Aanpasbare tekst (bijv. "GRATIS VERSIE - Upgrade naar Pro")
- **Positie**: 
  - Diagonaal (standaard)
  - Gecentreerd
  - Onderaan
  - Bovenaan
  - Footer
- **Transparantie**: 0 (transparant) tot 1 (ondoorzichtig)
- **Rotatie**: -180° tot 180°
- **Lettergrootte**: 10px tot 100px
- **Kleur**: HEX kleurcode
- **Live Preview**: Real-time preview van watermerk instellingen

#### 3. Gebruikers Beheer (`/admin/users`)
- Bekijk alle gebruikers
- Wijzig gebruikersrollen (USER, ADMIN, SUPERUSER)
- Bekijk abonnement status en factuur statistieken
- Gebruikers kunnen hun eigen rol niet wijzigen
- **Uitnodigingen Tab**: Beheer user invitations (alleen voor PRO accounts)
  - Verstuur uitnodigingen naar nieuwe gebruikers
  - Bekijk status van alle uitnodigingen
  - Kopieer uitnodigingslinks
  - Annuleer actieve uitnodigingen

#### 4. Abonnementen Beheer (`/admin/subscriptions`)
- Overzicht van alle gebruikersabonnementen
- Statistieken: totaal gebruikers, PRO accounts, actieve abonnementen
- Zoekfunctionaliteit op naam, email of bedrijfsnaam
- Bekijk abonnementsstatus, betalingscyclus, verloopt datum
- Stripe Customer ID tracking

### Watermerk Functionaliteit

Het watermerk systeem:
- ✅ Toont automatisch watermerk op PDF facturen voor FREE users
- ✅ Volledig configureerbaar via admin dashboard
- ✅ Live preview van wijzigingen
- ✅ Meerdere posities (diagonaal, center, footer, etc.)
- ✅ Aanpasbare transparantie, rotatie, grootte en kleur
- ✅ Alleen zichtbaar voor free users (PRO users zien geen watermerk)
- ✅ Werkt op zowel PDF downloads als email bijlagen

### Security Features

- **Role-based Access Control**: Alleen superusers kunnen admin dashboard benaderen
- **Protected Routes**: Admin routes zijn beveiligd met `requireSuperuser()` guard
- **API Protection**: Alle admin API endpoints controleren superuser status
- **Audit Trail**: Watermerk wijzigingen worden gelogd met `updatedBy` veld

## 📦 Deployment

### Vercel (Aanbevolen)

1. Push je code naar GitHub/GitLab
2. Importeer het project in Vercel
3. Voeg environment variables toe:
   - `DATABASE_URL`: Je PostgreSQL connection string
4. Deploy

### Database voor Productie

Voor productie wordt aanbevolen om een managed PostgreSQL database te gebruiken:
- **Vercel Postgres**
- **Supabase**
- **Neon**
- **Railway**
- **AWS RDS**

### Environment Variables

Maak een `.env` bestand in de root directory met de volgende variabelen:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_app?schema=public&sslmode=verify-full"

# NextAuth.js
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (optioneel voor development)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."

# Mollie Payments (optioneel)
MOLLIE_ENCRYPTION_KEY="generate-a-64-hex-character-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Genereer een NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Genereer een MOLLIE_ENCRYPTION_KEY (64 hex karakters):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Voor productie:**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=verify-full"
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Stripe (production keys)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_live_..."
STRIPE_PRICE_ID_YEARLY="price_live_..."

# Mollie Payments
MOLLIE_ENCRYPTION_KEY="your-64-hex-character-encryption-key"

NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

**Belangrijk voor SSL:** Voeg `&sslmode=verify-full` toe aan je `DATABASE_URL` om de SSL waarschuwing te voorkomen en maximale beveiliging te garanderen.

## 🐛 Troubleshooting

### Database Connection Issues

- Controleer of PostgreSQL draait
- Verifieer de `DATABASE_URL` in `.env`
- Test de connectie met: `npx prisma db pull`

### Prisma Client Issues

Als je schema wijzigingen hebt gemaakt:
```bash
npx prisma generate
```

### Build Errors

Zorg dat alle dependencies geïnstalleerd zijn:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licentie

Dit project is privé eigendom.

## 🤝 Contributing

Dit is een privé project. Voor vragen of suggesties, neem contact op met de project eigenaar.

## 📞 Support

Voor vragen of problemen:
1. Check de troubleshooting sectie
2. Controleer de Prisma logs
3. Check de browser console voor errors

## 📸 Screenshots

### Marketing Homepage
De marketing homepage (`/`) biedt:
- **Hero Sectie**: Krachtige headline met CTA buttons
- **Problem/Solution**: Toont de problemen die de app oplost
- **Features**: Overzicht van alle features met iconen
- **How It Works**: Stap-voor-stap uitleg
- **Pricing**: Transparante prijsweergave
- **Smooth Scrolling**: Automatische smooth scroll naar secties bij klikken op hash links
- **Responsive Design**: Volledig geoptimaliseerd voor alle devices

### Instellingen
De instellingen pagina is georganiseerd in 4 tabs:
- **Profiel**: Persoonlijke gegevens (naam, email)
- **Beveiliging**: Wachtwoord wijzigen en 2FA instellingen
- **Bedrijfsgegevens**: Bedrijfsinformatie en logo upload
- **Financiële gegevens**: BTW, KvK, IBAN en factuur instellingen
- **Email Instellingen**: Configureer email templates en auto-send instellingen

### Factuur Preview
Bekijk een live preview van je factuur voordat je deze verzendt of downloadt.

### Analytics Dashboard
Het analytics dashboard biedt een compleet overzicht van je business performance met:
- Real-time KPI tracking
- Interactieve grafieken en visualisaties
- Trend analyse en vergelijkingen
- Top klanten en product analyse
- Cashflow overzicht
- Doelstellingen tracking
- Excel export functionaliteit

### User Invitations
PRO accounts kunnen gebruikers uitnodigen:
- Verstuur uitnodigingen via email
- Kopieer uitnodigingslinks
- Bekijk status (Pending, Accepted, Expired, Cancelled)
- Uitnodigingen verlopen automatisch na 7 dagen
- Nieuwe gebruikers krijgen bedrijfsgegevens van de sender

### Audit Trail Systeem
Het audit trail systeem biedt volledige traceerbaarheid en compliance:
- **Automatische Logging**: Alle CRUD operaties worden automatisch gelogd
- **Chronologische Geschiedenis**: Bekijk de volledige geschiedenis van elke entiteit (facturen, klanten, producten)
- **Fraud Detectie**: Automatische detectie van verdachte activiteiten:
  - Acties buiten kantooruren
  - Bulk wijzigingen in korte tijd
  - Wijzigingen aan verzonden/betaalde facturen
  - Meerdere mislukte login pogingen
  - Onbekende IP-adressen
- **Compliance Features**:
  - Immutable logs (logs kunnen niet worden gewijzigd of verwijderd)
  - Hash-chain voor tamper detection
  - Export functionaliteit voor accountantscontrole (CSV/JSON)
  - 7+ jaar bewaartermijn ondersteuning
- **UI Componenten**:
  - Timeline view per entiteit
  - Global audit log met filters
  - Recent activity dashboard widget
  - Alerts overzicht voor verdachte activiteiten
- **API Endpoints**: Volledige REST API voor audit log querying en export

## 🚧 Toekomstige Features

- [x] Email verzending (Resend API) ✅
- [x] Recurring invoices ✅
- [x] Invoice reminders ✅
- [x] Export naar Excel/CSV ✅
- [x] Time tracking integration ✅
- [x] Analytics & BI Dashboard ✅
- [x] Watermerk systeem voor free users ✅
- [x] Admin dashboard met gebruikersbeheer ✅
- [x] Stripe subscription systeem met feature gating ✅
- [x] Marketing homepage met smooth scrolling ✅
- [x] User invitations voor PRO accounts ✅
- [x] Abonnementen overzicht in admin dashboard ✅
- [x] Audit trail systeem met fraud detectie ✅
- [x] Credit nota's met volledige workflow ✅
- [x] Import/Export functionaliteit voor klanten, facturen, producten, onkosten en tijdregistraties ✅
- [ ] Klantportaal voor factuur inzage en betaling
- [ ] Forecasting & predictive analytics
- [ ] Benchmarking tegen industrie gemiddeldes
- [ ] Geautomatiseerde email rapporten (wekelijks/maandelijks)
- [ ] Custom report builder
- [ ] Multi-year vergelijkingen
- [ ] Multi-currency support
- [ ] Quotes (offerten) module
- [ ] Dark mode
- [ ] Multi-language support

---

**Gemaakt met ❤️ voor Nederlandse ZZP-ers en kleine bedrijven**
