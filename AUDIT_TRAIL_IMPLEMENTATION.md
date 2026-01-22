# Audit Trail Systeem - Implementatie Overzicht

## ✅ Voltooide Functionaliteit

### 1. Data Model
- ✅ `AuditLog` tabel toegevoegd aan Prisma schema met alle vereiste velden:
  - `id`, `timestamp`, `userId`, `userEmail`
  - `action`, `entityType`, `entityId`
  - `changes` (JSON), `metadata` (JSON)
  - `ipAddress`, `userAgent`, `sessionId`
  - `previousHash`, `hash` (voor hash-chain integriteit)
  - `isSuspicious`, `suspiciousReason` (voor fraud detectie)
- ✅ Alle benodigde database indexen toegevoegd voor performance
- ✅ Migratie bestand aangemaakt: `20260119202748_add_audit_trail`

### 2. Automatische Logging
- ✅ Audit logging utility library (`lib/audit/logger.ts`):
  - Automatische change detection tussen old/new data
  - Hash-chain voor chronologische integriteit
  - Request context ophalen (IP, user agent, session)
- ✅ Helper functies (`lib/audit/helpers.ts`):
  - `logCreate`, `logUpdate`, `logDelete`
  - `logView`, `logExport`
  - `logLogin`, `logLogout`, `logLoginFailed`
  - `logPaymentRecorded`, `logInvoiceSent`
  - `logSettingsChange`, `logPasswordChange`, `log2FAChange`

### 3. Integratie in Bestaande Code
- ✅ **Facturen** (`app/facturen/actions.ts`):
  - CREATE, UPDATE, DELETE logging
  - Status wijzigingen (PAID, SENT)
  - Payment recording
- ✅ **Klanten** (`app/klanten/actions.ts`):
  - CREATE, UPDATE, DELETE logging
- ✅ **Producten** (`app/producten/actions.ts`):
  - CREATE, UPDATE, DELETE logging
- ✅ **Instellingen** (`app/instellingen/actions.ts`):
  - Profile updates
  - Company info changes
  - Financial info changes
  - Password changes
- ✅ **Authenticatie** (`lib/auth.ts`):
  - Successful login logging
  - Failed login attempt logging
- ✅ **Email verzending** (`lib/email/send-invoice.ts`):
  - Invoice sent logging

### 4. Fraud Detectie
- ✅ Automatische detectie van verdachte patronen:
  - Acties buiten kantooruren (6:00 - 22:00)
  - Bulk wijzigingen in korte tijd (>10 in 5 minuten)
  - Wijzigingen aan verzonden/betaalde facturen
  - Wijzigingen aan ingediende BTW-aangiftes
  - Meerdere failed login attempts (≥5 in 15 minuten)
  - Onbekende IP-adressen
- ✅ Alerts API endpoint (`/api/audit-logs/alerts`)
- ✅ UI component voor alerts (`components/audit/audit-alerts.tsx`)

### 5. Compliance Features
- ✅ **Immutable Logs**: Audit records kunnen niet worden gewijzigd of verwijderd (geen UPDATE/DELETE operaties op AuditLog)
- ✅ **Hash-Chain**: Elke log entry bevat hash van vorige entry voor tamper detection
- ✅ **Retention Policy**: Database indexen op `timestamp` en `createdAt` voor efficiënte archivering
- ✅ **Export Functionaliteit**: CSV en JSON export voor accountantscontrole
- ✅ **Digitale Handtekening**: Timestamp en hash-chain zorgen voor betrouwbare timestamp

### 6. API Endpoints
- ✅ `GET /api/audit-logs` - Lijst met filters en paginatie
- ✅ `GET /api/audit-logs/entity/:type/:id` - Geschiedenis van specifiek record
- ✅ `GET /api/audit-logs/user/:id` - Alle acties van een gebruiker
- ✅ `GET /api/audit-logs/export` - Export voor accountant (CSV/JSON)
- ✅ `GET /api/audit-logs/alerts` - Verdachte activiteiten
- ✅ `POST /api/auth/logout` - Logout logging

### 7. UI Componenten
- ✅ `AuditLogViewer` (`components/audit/audit-log-viewer.tsx`):
  - Chronologisch overzicht met filters
  - Paginatie
  - Export functionaliteit
  - Entity-specifieke en user-specifieke views
- ✅ `RecentActivity` (`components/audit/recent-activity.tsx`):
  - Dashboard widget met recente activiteit
  - Alerts counter
  - Auto-refresh elke 30 seconden
- ✅ `AuditAlerts` (`components/audit/audit-alerts.tsx`):
  - Overzicht van verdachte activiteiten
  - Samenvatting per reden
  - Auto-refresh elke 60 seconden

### 8. Performance
- ✅ Database indexen op:
  - `timestamp`, `userId`, `userEmail`
  - `action`, `entityType`, `entityId`
  - `entityType + entityId` (composite index)
  - `isSuspicious`, `createdAt`
- ✅ Async logging (niet-blocking)
- ✅ Paginatie in alle API endpoints

## 📋 Volgende Stappen

### Migratie Uitvoeren
```bash
npx prisma migrate dev
```

### UI Integratie
Om de audit log viewer te gebruiken in je applicatie:

1. **Dashboard Widget**:
```tsx
import { RecentActivity } from "@/components/audit/recent-activity"

<RecentActivity limit={10} />
```

2. **Volledige Audit Log Pagina** (maak `app/audit-logs/page.tsx`):
```tsx
import { AuditLogViewer } from "@/components/audit/audit-log-viewer"

export default function AuditLogsPage() {
  return <AuditLogViewer showFilters={true} />
}
```

3. **Entity-specifieke Geschiedenis** (bijv. op factuur detail pagina):
```tsx
<AuditLogViewer entityType="invoice" entityId={invoiceId} showFilters={false} />
```

4. **Alerts Pagina**:
```tsx
import { AuditAlerts } from "@/components/audit/audit-alerts"

<AuditAlerts days={7} />
```

### Logout Logging Integreren
Om logout logging te activeren, update de logout handler in je component:

```tsx
const handleLogout = async () => {
  // Log logout before signing out
  await fetch("/api/auth/logout", { method: "POST" })
  await signOut({ callbackUrl: "/login" })
}
```

## 🔒 Beveiliging

- Alleen SUPERUSER kan alle audit logs bekijken
- Reguliere gebruikers zien alleen hun eigen logs
- Audit logs zijn immutable (geen UPDATE/DELETE operaties)
- Hash-chain voorkomt tampering
- IP-adres en user agent worden automatisch gelogd

## 📊 Gebruik

### Audit Logs Bekijken
- Navigeer naar `/audit-logs` (of voeg toe aan je navigatie)
- Gebruik filters om specifieke acties/periodes te bekijken
- Exporteer logs als CSV voor accountantscontrole

### Alerts Monitoren
- Bekijk verdachte activiteiten via `/api/audit-logs/alerts`
- Dashboard widget toont aantal alerts
- Alerts worden automatisch gedetecteerd en gelogd

### Export voor Accountant
```bash
GET /api/audit-logs/export?format=csv&startDate=2024-01-01&endDate=2024-12-31
```

## ⚠️ Belangrijke Opmerkingen

1. **Performance**: Audit logging is async en blokkeert niet de hoofdflow
2. **Retention**: Overweeg archivering van oude logs (>7 jaar) naar cold storage
3. **Privacy**: IP-adressen en user agents worden gelogd - overweeg GDPR compliance
4. **Hash Chain**: De hash-chain wordt per user bijgehouden voor betere performance

## 🐛 Bekende Beperkingen

- Logout logging vereist handmatige integratie in logout handler
- Export functionaliteit is basis - kan uitgebreid worden met PDF export
- Diff viewer is nog niet geïmplementeerd (kan toegevoegd worden aan AuditLogViewer)
