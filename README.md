# Facturatie App

Een professionele facturatie web applicatie voor Nederlandse ZZP-ers en kleine bedrijven. Maak, beheer en verstuur facturen met volledige BTW-ondersteuning en Nederlandse factuurvereisten.

## ✨ Features

- 📄 **Facturen beheren**: Maak, bewerk en beheer facturen met automatische nummering
- 👁️ **Factuur Preview**: Bekijk een live preview van je factuur voordat je deze verzendt
- 👥 **Klantenbeheer**: Beheer je klantenbestand met volledige contactgegevens
- 📦 **Producten & Diensten**: Definieer herbruikbare producten en diensten
- 💰 **BTW-berekening**: Automatische BTW-berekening voor 0%, 9% en 21% tarieven
- 📊 **Dashboard**: Overzicht van openstaande facturen, omzet en statistieken
- 📑 **PDF Export**: Professionele PDF facturen met alle vereiste gegevens
- 🖼️ **Bedrijfslogo**: Upload je bedrijfslogo voor gebruik op facturen
- 🔐 **Authenticatie**: Veilige authenticatie met NextAuth.js v5
- 🔒 **Twee-Factor Authenticatie (2FA)**: Extra beveiliging met TOTP authenticatie
- 🇳🇱 **Nederlandse standaarden**: Volledig aangepast aan Nederlandse factuurvereisten
- 🎨 **Modern UI**: Gebouwd met Next.js 15, React 19, Tailwind CSS en shadcn/ui

## 🛠️ Technische Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **Database**: PostgreSQL met Prisma ORM
- **Forms**: React Hook Form + Zod validatie
- **PDF**: @react-pdf/renderer
- **Data Fetching**: Server Actions

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
  /(dashboard)
    page.tsx              # Dashboard overview
    /facturen             # Facturen beheer
      page.tsx            # Facturen lijst
      /[id]               # Factuur detail
      /nieuw              # Nieuwe factuur
      actions.ts          # Server actions
    /klanten              # Klanten beheer
    /producten            # Producten beheer
    /instellingen         # Bedrijfsinstellingen
  /api
    /invoices/[id]/pdf    # PDF generatie endpoint
/components
  /ui                    # shadcn/ui components
  /dashboard             # Dashboard components
  /invoices              # Factuur components
  /customers              # Klant components
  /products              # Product components
/lib
  db.ts                  # Prisma client
  validations.ts         # Zod schemas
  utils.ts              # Helper functions
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

Zie `prisma/schema.prisma` voor het volledige schema.

## 🎯 Gebruik

### Eerste Setup

1. **Profiel instellen**
   - Ga naar Instellingen → Profiel
   - Vul je naam en email in
   - Sla op

2. **Bedrijfsgegevens instellen**
   - Ga naar Instellingen → Bedrijfsgegevens
   - Vul je bedrijfsgegevens in (naam, adres, postcode, stad, land, telefoon)
   - Upload je bedrijfslogo (optioneel, wordt getoond op facturen)
   - Sla op

3. **Financiële gegevens instellen**
   - Ga naar Instellingen → Financiële gegevens
   - Vul je BTW-nummer, KvK-nummer en IBAN in
   - Pas je factuur prefix aan indien gewenst
   - Sla op

2. **Klanten toevoegen**
   - Ga naar Klanten
   - Klik op "Nieuwe Klant"
   - Vul klantgegevens in

3. **Producten/Diensten toevoegen** (optioneel)
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

### Dashboard

Het dashboard toont:
- **Openstaand**: Totaalbedrag van verzonden en achterstallige facturen
- **Achterstallig**: Aantal en bedrag van achterstallige facturen
- **Omzet deze maand**: Totaal van betaalde facturen deze maand
- **Klanten**: Aantal klanten
- **Recente facturen**: Laatste 5 facturen

## 🔧 Development

### Database Migraties

Maak een nieuwe migratie:
```bash
npx prisma migrate dev --name migration_name
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

## 🔐 Authenticatie

De applicatie gebruikt **NextAuth.js v5** met:
- Email/wachtwoord authenticatie
- Twee-factor authenticatie (2FA) met TOTP
- JWT-based sessies
- Wachtwoord wijzigen functionaliteit

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

# Node Environment
NODE_ENV="development"
```

**Genereer een NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Voor productie:**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=verify-full"
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
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

### Instellingen
De instellingen pagina is georganiseerd in 4 tabs:
- **Profiel**: Persoonlijke gegevens (naam, email)
- **Beveiliging**: Wachtwoord wijzigen en 2FA instellingen
- **Bedrijfsgegevens**: Bedrijfsinformatie en logo upload
- **Financiële gegevens**: BTW, KvK, IBAN en factuur instellingen

### Factuur Preview
Bekijk een live preview van je factuur voordat je deze verzendt of downloadt.

## 🚧 Toekomstige Features

- [ ] Email verzending (Resend API)
- [ ] Recurring invoices
- [ ] Invoice reminders
- [ ] Export naar Excel/CSV
- [ ] Multi-currency support
- [ ] Time tracking integration
- [ ] Quotes (offerten) module
- [ ] Dark mode
- [ ] Multi-language support

---

**Gemaakt met ❤️ voor Nederlandse ZZP-ers en kleine bedrijven**
