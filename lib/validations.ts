import { z } from "zod"

// Nederlandse postcode validatie (1234 AB of 1234AB)
const postcodeRegex = /^\d{4}\s?[A-Z]{2}$/

// BTW-nummer validatie (NL123456789B01)
const vatNumberRegex = /^NL\d{9}B\d{2}$/

// IBAN validatie (NL + 2 cijfers + 4 letters + 10 cijfers)
const ibanRegex = /^NL\d{2}[A-Z]{4}\d{10}$/

// ========== Customer Schema ==========
export const customerSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  companyName: z.string().optional().nullable(),
  email: z.string().email("Ongeldig e-mailadres"),
  phone: z.string().optional().nullable(),
  address: z.string().min(1, "Adres is verplicht"),
  city: z.string().min(1, "Plaats is verplicht"),
  postalCode: z
    .string()
    .regex(postcodeRegex, "Ongeldig postcode formaat (bijv. 1234 AB)"),
  country: z.string().min(1, "Land is verplicht"),
  vatNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || vatNumberRegex.test(val),
      "Ongeldig BTW-nummer formaat (bijv. NL123456789B01)"
    ),
  paymentTermDays: z.number().int().min(0),
  notes: z.string().optional().nullable(),
  // Multi-currency support - default currency for this customer
  currencyId: z.string().optional().nullable(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

// ========== Product Schema ==========
export const productSchema = z.object({
  name: z.string().min(1, "Productnaam is verplicht"),
  description: z.string().optional().nullable(),
  unitPrice: z.number()
    .positive("Prijs moet hoger dan 0 zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  vatRate: z.number()
    .refine((val) => [0, 9, 21].includes(val), "Kies 0%, 9% of 21%"),
  unit: z.string().min(1, "Eenheid is verplicht"),
  isActive: z.boolean(),
})

export type ProductFormData = z.infer<typeof productSchema>

// ========== Invoice Item Schema ==========
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.number()
    .positive("Aantal moet hoger dan 0 zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  unitPrice: z.number()
    .min(0, "Prijs mag niet negatief zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  vatRate: z.number()
    .refine((val) => [0, 9, 21].includes(val), "Kies 0%, 9% of 21%"),
  unit: z.string().min(1, "Eenheid is verplicht"),
})

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>

// ========== Invoice Schema ==========
export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Selecteer een klant"),
  invoiceDate: z.date(),
  dueDate: z.date(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  // Multi-currency support (optional, defaults to EUR in server action)
  currencyCode: z.string().length(3, "Valutacode moet 3 tekens zijn").optional(),
  items: z
    .array(invoiceItemSchema)
    .min(1, "Voeg minimaal één regel toe"),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

// ========== Credit Note Item Schema ==========
export const creditNoteItemSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.number()
    .positive("Aantal moet hoger dan 0 zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  unitPrice: z.number()
    .min(0, "Prijs mag niet negatief zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  vatRate: z.number()
    .refine((val) => [0, 9, 21].includes(val), "Kies 0%, 9% of 21%"),
  unit: z.string().min(1, "Eenheid is verplicht"),
  originalInvoiceItemId: z.string().optional().nullable(),
})

export type CreditNoteItemFormData = z.infer<typeof creditNoteItemSchema>

// ========== Credit Note Reason Enum ==========
export const creditNoteReasons = [
  "PRICE_CORRECTION",
  "QUANTITY_CORRECTION",
  "RETURN",
  "CANCELLATION",
  "DISCOUNT_AFTER",
  "VAT_CORRECTION",
  "DUPLICATE_INVOICE",
  "GOODWILL",
  "OTHER",
] as const

export type CreditNoteReason = typeof creditNoteReasons[number]

// ========== Credit Note Schema ==========
export const creditNoteSchema = z.object({
  customerId: z.string().min(1, "Selecteer een klant"),
  creditNoteDate: z.date(),
  reason: z.enum(creditNoteReasons, { message: "Selecteer een reden" }),
  originalInvoiceId: z.string().optional().nullable(),
  originalInvoiceNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  items: z
    .array(creditNoteItemSchema)
    .min(1, "Voeg minimaal één regel toe"),
}).refine(
  (data) => {
    // If reason is OTHER, description is required
    if (data.reason === "OTHER") {
      return data.description && data.description.trim().length > 0
    }
    return true
  },
  {
    message: "Omschrijving is verplicht bij reden 'Overig'",
    path: ["description"],
  }
)

export type CreditNoteFormData = z.infer<typeof creditNoteSchema>

// ========== Profile Schema ==========
export const profileSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email("Ongeldig e-mailadres"),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// ========== Company Info Schema ==========
export const companyInfoSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  companyEmail: z.string().email("Ongeldig e-mailadres"),
  companyPhone: z.string().optional().nullable(),
  companyAddress: z.string().min(1, "Adres is verplicht"),
  companyCity: z.string().min(1, "Plaats is verplicht"),
  companyPostalCode: z
    .string()
    .regex(postcodeRegex, "Ongeldig postcode formaat (bijv. 1234 AB)"),
  companyCountry: z.string().min(1, "Land is verplicht"),
  companyLogo: z.string().optional().nullable(),
})

export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>

// ========== Financial Info Schema ==========
export const financialInfoSchema = z.object({
  vatNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || vatNumberRegex.test(val),
      "Ongeldig BTW-nummer formaat (bijv. NL123456789B01)"
    ),
  kvkNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^\d{8}$/.test(val),
      "KvK-nummer moet 8 cijfers zijn"
    ),
  iban: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || ibanRegex.test(val.replace(/\s/g, "")),
      "Ongeldig IBAN formaat"
    ),
  invoicePrefix: z.string().min(1, "Prefix is verplicht"),
})

export type FinancialInfoFormData = z.infer<typeof financialInfoSchema>

// ========== User/Company Settings Schema (legacy, kept for backwards compatibility) ==========
export const companySettingsSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  companyEmail: z.string().email("Ongeldig e-mailadres"),
  companyPhone: z.string().optional().nullable(),
  companyAddress: z.string().min(1, "Adres is verplicht"),
  companyCity: z.string().min(1, "Plaats is verplicht"),
  companyPostalCode: z
    .string()
    .regex(postcodeRegex, "Ongeldig postcode formaat (bijv. 1234 AB)"),
  companyCountry: z.string().min(1, "Land is verplicht"),
  vatNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || vatNumberRegex.test(val),
      "Ongeldig BTW-nummer formaat (bijv. NL123456789B01)"
    ),
  kvkNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^\d{8}$/.test(val),
      "KvK-nummer moet 8 cijfers zijn"
    ),
  iban: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || ibanRegex.test(val.replace(/\s/g, "")),
      "Ongeldig IBAN formaat"
    ),
  invoicePrefix: z.string().min(1, "Prefix is verplicht"),
})

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>

// ========== Login Schema ==========
export const loginSchema = z.object({
  email: z.string().email("Ongeldig e-mailadres"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 karakters zijn"),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ========== Register Schema ==========
// Alleen basisgegevens; bedrijfsgegevens worden na registratie ingevuld (onboarding)
export const registerSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 karakters zijn"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// ========== Change Password Schema ==========
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Huidig wachtwoord is verplicht"),
    newPassword: z.string().min(6, "Wachtwoord moet minimaal 6 karakters zijn"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Wachtwoorden komen niet overeen",
    path: ["confirmPassword"],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ========== Mollie Settings Schema ==========
export const mollieSettingsSchema = z.object({
  mollieApiKey: z
    .string()
    .min(1, "API key is verplicht")
    .refine(
      (val) => val.startsWith("test_") || val.startsWith("live_"),
      "API key moet beginnen met 'test_' of 'live_'"
    ),
  mollieEnabled: z.boolean(),
  mollieTestMode: z.boolean(),
})

export type MollieSettingsFormData = z.infer<typeof mollieSettingsSchema>

// ========== Fiscal Settings Schema ==========
export const businessTypes = ['EENMANSZAAK', 'VOF', 'MAATSCHAP', 'BV'] as const
export type BusinessType = typeof businessTypes[number]

export const homeOfficeTypes = ['INDEPENDENT', 'NON_INDEPENDENT'] as const
export type HomeOfficeType = typeof homeOfficeTypes[number]

export const fiscalSettingsSchema = z.object({
  businessType: z.enum(businessTypes, { message: "Selecteer een rechtsvorm" }),
  useKOR: z.boolean(),
  hoursTracked: z.boolean(),
  manualHoursPerYear: z
    .number()
    .int("Voer een geheel getal in")
    .min(0, "Uren kunnen niet negatief zijn")
    .max(8760, "Maximaal 8760 uur per jaar")
    .optional()
    .nullable(),
  isStarter: z.boolean(),
  starterYearsUsed: z
    .number()
    .int()
    .min(0, "Kan niet negatief zijn")
    .max(3, "Maximaal 3 jaar startersaftrek"),
  firstStarterYear: z
    .number()
    .int()
    .min(2000, "Jaar moet na 2000 zijn")
    .optional()
    .nullable(),
  hasHomeOffice: z.boolean(),
  homeOfficeType: z
    .enum(homeOfficeTypes, { message: "Selecteer type werkruimte" })
    .optional()
    .nullable(),
  homeOfficePercentage: z
    .number()
    .min(0, "Percentage kan niet negatief zijn")
    .max(100, "Maximaal 100%")
    .optional()
    .nullable(),
  hasBusinessCar: z.boolean(),
  carPrivateUsage: z
    .number()
    .min(0, "Percentage kan niet negatief zijn")
    .max(100, "Maximaal 100%")
    .optional()
    .nullable(),
  useFOR: z.boolean(),
})

export type FiscalSettingsFormData = z.infer<typeof fiscalSettingsSchema>

// ========== Asset Schema ==========
export const assetCategories = [
  'EQUIPMENT',
  'VEHICLE',
  'FURNITURE',
  'SOFTWARE',
  'BUILDING',
  'INTANGIBLE',
  'OTHER',
] as const
export type AssetCategory = typeof assetCategories[number]

export const depreciationMethods = ['LINEAR', 'DEGRESSIVE'] as const
export type DepreciationMethod = typeof depreciationMethods[number]

export const assetSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().optional().nullable(),
  category: z.enum(assetCategories, { message: "Selecteer een categorie" }),
  purchaseDate: z.date({ message: "Aankoopdatum is verplicht" }),
  purchasePrice: z
    .number()
    .positive("Aanschafprijs moet positief zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  supplier: z.string().optional().nullable(),
  usefulLifeYears: z
    .number()
    .int("Voer een geheel getal in")
    .min(1, "Minimaal 1 jaar")
    .max(50, "Maximaal 50 jaar"),
  residualValue: z
    .number()
    .min(0, "Restwaarde kan niet negatief zijn")
    .multipleOf(0.01, "Maximaal 2 decimalen"),
  depreciationMethod: z.enum(depreciationMethods, { message: "Selecteer een afschrijvingsmethode" }),
})

export type AssetFormData = z.infer<typeof assetSchema>

// ========== Expense Categories Enum ==========
export const expenseCategories = [
  'OFFICE',
  'TRAVEL',
  'EQUIPMENT',
  'SOFTWARE',
  'MARKETING',
  'EDUCATION',
  'INSURANCE',
  'ACCOUNTANT',
  'TELECOM',
  'UTILITIES',
  'RENT',
  'MAINTENANCE',
  'PROFESSIONAL',
  'OTHER',
] as const
export type ExpenseCategoryType = typeof expenseCategories[number]

// ========== Vendor Schema ==========
export const vendorSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  aliases: z.array(z.string()).default([]),
  defaultCategory: z.enum(expenseCategories, { message: "Selecteer een categorie" }),
  website: z.string().url("Ongeldig URL formaat").optional().nullable().or(z.literal('')),
  vatNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || vatNumberRegex.test(val),
      "Ongeldig BTW-nummer formaat (bijv. NL123456789B01)"
    ),
})

export type VendorFormData = z.infer<typeof vendorSchema>

// ========== Contact Form Schema ==========
export const contactFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht").max(200, "Naam is te lang"),
  email: z.string().email("Ongeldig e-mailadres"),
  company: z.string().max(200).optional(),
  subject: z.string().min(1, "Onderwerp is verplicht").max(100),
  subjectLabel: z.string().max(200).optional(),
  message: z.string().min(1, "Bericht is verplicht").max(5000, "Bericht is te lang"),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
