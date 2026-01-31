# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Declair is a Dutch invoicing web application for ZZP-ers (freelancers) and small businesses. It handles invoices, customers, products, time tracking, recurring invoices, VAT reporting, and analytics with full Dutch localization.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server on http://localhost:3000
npm run build            # Build for production (includes prisma generate)
npm run lint             # Run ESLint

# Database
npx prisma generate      # Regenerate Prisma Client after schema changes
npx prisma migrate dev   # Apply migrations in development
npx prisma studio        # Open database GUI
```

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM (using `@prisma/adapter-pg`)
- **Auth**: NextAuth.js v5 (beta) with credentials provider and optional 2FA
- **Payments**: Stripe for subscriptions
- **PDF**: @react-pdf/renderer
- **Email**: Resend API
- **Forms**: React Hook Form + Zod validation
- **OCR**: Anthropic Claude Vision API for receipt extraction (PRO feature)
- **File Storage**: Vercel Blob for receipt uploads (production)

## Architecture

### Route Structure
- `app/(auth)/` - Login/register pages (public)
- `app/(marketing)/` - Marketing homepage and pricing (public)
- `app/admin/` - Admin dashboard (SUPERUSER only)
- `app/facturen/`, `app/klanten/`, `app/producten/` - Main CRUD modules
- `app/tijd/` - Time tracking (PRO feature)
- `app/btw/` - VAT reporting (PRO feature)
- `app/abonnementen/` - Recurring invoices (PRO feature)
- `app/dashboard/` - Analytics dashboard (PRO feature)
- `app/instellingen/import-export/` - Import/export hub
- `app/api/export/` - Export endpoints (customers, invoices, products, expenses, time-entries)
- `app/api/import/` - Import endpoints (upload, validate, execute, status)
- `app/api/ocr/` - OCR extraction endpoint for receipts (PRO feature)

### Server Actions Pattern
Data mutations use Next.js Server Actions in `actions.ts` files colocated with their routes:
- `app/facturen/actions.ts` - Invoice CRUD
- `app/klanten/actions.ts` - Customer CRUD
- `app/producten/actions.ts` - Product CRUD

Each action:
1. Gets authenticated user via `getCurrentUserId()` from `lib/server-utils.ts`
2. Validates input with Zod schemas from `lib/validations.ts`
3. Performs database operations with `db` from `lib/db.ts`
4. Calls `revalidatePath()` to refresh cached data

### Authentication & Authorization
- `lib/auth.ts` - NextAuth configuration with credentials + 2FA
- `lib/auth/admin-guard.ts` - SUPERUSER permission checks (`requireSuperuser()`)
- `lib/auth/subscription-guard.ts` - Feature access checks (`requireFeature()`)
- `lib/get-session.ts` / `lib/server-utils.ts` - Session helpers for server components

### Subscription System (Feature Gating)
Premium features are controlled via `lib/stripe/subscriptions.ts`:
- `hasFeatureAccess(userId, feature)` - Check if user can access feature
- `canCreateInvoice(userId)` - Check invoice limits (FREE: 50/month)
- Features: `recurring_invoices`, `vat_reporting`, `time_tracking`, `analytics`, `export`, `ocr_extraction`
- SUPERUSER role bypasses all feature gates

### Key Library Files
- `lib/db.ts` - Prisma client with lazy initialization proxy
- `lib/validations.ts` - All Zod schemas with Dutch validation messages
- `lib/utils.ts` - Utilities: `cn()`, `formatCurrency()`, `formatDate()`, `generateInvoiceNumber()`
- `lib/pdf/watermark.ts` - PDF watermark for FREE users
- `lib/import-export/` - Import/export services with field definitions per entity
- `lib/ocr/` - OCR service for receipt extraction using Claude Vision API

### Component Organization
- `components/ui/` - shadcn/ui base components
- `components/invoices/`, `components/customers/`, etc. - Domain-specific components
- `components/admin/` - Admin dashboard components
- `components/subscription/` - Feature gating UI components
- `components/analytics/` - Charts and KPI cards
- `components/import-export/` - Export button, modal, and import wizard components

## Conventions

### Language
- All user-facing text is in Dutch
- Code, comments, and variable names are in English
- Validation messages in `lib/validations.ts` are Dutch

### Dutch Formatting
- Dates: `dd-MM-yyyy` via `formatDate()`
- Currency: `€ 1.234,56` via `formatCurrency()`
- VAT rates: 0%, 9%, 21%
- Postal codes: `1234 AB` pattern
- VAT numbers: `NL123456789B01` pattern

### Database
- All amounts use `Decimal(10, 2)` for precision
- User data is scoped by `userId` - always filter by it
- Use `@index` for frequently queried foreign keys

### Forms
- Use React Hook Form with `zodResolver`
- Schema defined in `lib/validations.ts`
- Form components in `components/{domain}/{domain}-form.tsx`

## Environment Variables

Required:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

For Stripe subscriptions:
```env
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For OCR (receipt extraction):
```env
ANTHROPIC_API_KEY="sk-ant-..."
```

For Vercel Blob (file uploads in production):
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

For Google Analytics (optional; only loaded when user accepts cookies):
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."
```
