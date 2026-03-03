"use client"

import { useForm, useFieldArray, Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Plus, Trash2, CalendarIcon, Info } from "lucide-react"
import { format, addDays } from "date-fns"
import { nl } from "date-fns/locale"
import { toast } from "sonner"
import { isRedirectError } from "next/dist/client/components/redirect-error"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { quoteSchema, type QuoteFormData } from "@/lib/validations"
import {
  formatCurrencyWithCode,
  roundToTwo,
  cn,
  getCurrencyDecimals,
} from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency/formatting"
import { createQuote, updateQuote } from "@/app/offertes/actions"
import { CurrencySelector } from "@/components/currency/currency-selector"
import { ExchangeRateDisplay } from "@/components/currency/exchange-rate-display"
import { useTranslatedUtils } from "@/components/providers/locale-provider"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  companyName?: string | null
  paymentTermDays: number
}

interface Product {
  id: string
  name: string
  unitPrice: number
  vatRate: number
  unit: string
}

interface QuoteFormProps {
  quote?: QuoteFormData & { id: string; quoteNumber: string; currencyCode?: string }
  customers: Customer[]
  products: Product[]
  useKOR?: boolean
  defaultExpiryDays?: number
}

// ─── DatePicker — buiten component om re-mount bij re-render te voorkomen ────

interface DatePickerFieldProps {
  control: Control<QuoteFormData>
  name: "quoteDate" | "expiryDate"
  label: string
  optional?: boolean
}

function DatePickerField({ control, name, label, optional }: DatePickerFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>
            {label}
            {optional && <span className="ml-1 text-muted-foreground">(optioneel)</span>}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {field.value ? (
                    format(field.value as Date, "d MMMM yyyy", { locale: nl })
                  ) : (
                    <span>Selecteer datum</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date | undefined}
                onSelect={field.onChange}
                locale={nl}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuoteForm({
  quote,
  customers,
  products,
  useKOR = false,
  defaultExpiryDays = 30,
}: QuoteFormProps) {
  const router = useRouter()
  const { VAT_RATES, UNITS } = useTranslatedUtils()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const today = new Date()
  const defaultExpiryDate = addDays(today, defaultExpiryDays)

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote
      ? {
          ...quote,
          currencyCode: quote.currencyCode ?? "EUR",
        }
      : {
          customerId: "",
          quoteDate: today,
          expiryDate: defaultExpiryDate,
          reference: "",
          notes: "",
          internalNotes: "",
          currencyCode: "EUR",
          items: [
            {
              description: "",
              quantity: 1,
              unitPrice: 0,
              vatRate: useKOR ? 0 : 21,
              unit: "uur",
            },
          ],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items")
  const watchedCurrencyCode = form.watch("currencyCode") || "EUR"
  const currencySymbol = getCurrencySymbol(watchedCurrencyCode)

  // ─── Calculations ────────────────────────────────────────────────────────

  const calculateItemTotal = (item: (typeof watchedItems)[0]) => {
    const subtotal = roundToTwo(item.quantity * item.unitPrice)
    const effectiveVatRate = useKOR ? 0 : item.vatRate
    const vatAmount = roundToTwo(subtotal * (effectiveVatRate / 100))
    return { subtotal, vatAmount, total: roundToTwo(subtotal + vatAmount) }
  }

  const totals = watchedItems.reduce(
    (acc, item) => {
      const { subtotal, vatAmount, total } = calculateItemTotal(item)
      return {
        subtotal: roundToTwo(acc.subtotal + subtotal),
        vatAmount: roundToTwo(acc.vatAmount + vatAmount),
        total: roundToTwo(acc.total + total),
      }
    },
    { subtotal: 0, vatAmount: 0, total: 0 },
  )

  const vatByRate = watchedItems.reduce(
    (acc, item) => {
      const { subtotal, vatAmount } = calculateItemTotal(item)
      const rate = item.vatRate.toString()
      if (!acc[rate]) acc[rate] = { subtotal: 0, vatAmount: 0 }
      acc[rate].subtotal = roundToTwo(acc[rate].subtotal + subtotal)
      acc[rate].vatAmount = roundToTwo(acc[rate].vatAmount + vatAmount)
      return acc
    },
    {} as Record<string, { subtotal: number; vatAmount: number }>,
  )

  // ─── Product quick-add ───────────────────────────────────────────────────

  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      append({
        description: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        vatRate: useKOR ? 0 : product.vatRate,
        unit: product.unit,
      })
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function onSubmit(data: QuoteFormData, status: "DRAFT" | "SENT" = "DRAFT") {
    setIsSubmitting(true)
    setFormError(null)
    try {
      if (quote?.id) {
        await updateQuote(quote.id, data, status)
      } else {
        await createQuote(data, status)
      }
      toast.success(status === "SENT" ? "Offerte verstuurd" : "Offerte opgeslagen als concept")
      router.push("/offertes")
      router.refresh()
    } catch (error) {
      // Next.js redirect errors moeten doorpropageren (bijv. vanuit requireCompanyDetails)
      if (isRedirectError(error)) throw error
      const message =
        error instanceof Error ? error.message : "Er is een onbekende fout opgetreden"
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form className="space-y-6">
        {useKOR && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Kleineondernemersregeling (KOR)</AlertTitle>
            <AlertDescription>
              Je maakt gebruik van de KOR. Er wordt geen BTW in rekening gebracht op deze offerte.
              Wijzigen via{" "}
              <a href="/instellingen" className="underline font-medium">
                Instellingen &gt; Fiscaal
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Fout bij opslaan</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Klant & datums */}
            <Card>
              <CardHeader>
                <CardTitle>Klant & datum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Klant */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecteer klant *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies een klant..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.companyName
                                ? `${customer.companyName} (${customer.name})`
                                : customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Datums */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DatePickerField control={form.control} name="quoteDate" label="Offertedatum" />
                  <DatePickerField
                    control={form.control}
                    name="expiryDate"
                    label="Verloopdatum"
                    optional
                  />
                </div>

                {/* Referentie & valuta */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referentie klant</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bijv. PO-12345"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currencyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valuta</FormLabel>
                        <FormControl>
                          <CurrencySelector
                            value={field.value || "EUR"}
                            onChange={field.onChange}
                            showRate={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchedCurrencyCode !== "EUR" && (
                  <ExchangeRateDisplay toCurrency={watchedCurrencyCode} className="mt-4" />
                )}
              </CardContent>
            </Card>

            {/* Offerteregels */}
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Offerteregels</CardTitle>
                {products.length > 0 && (
                  <Select onValueChange={addProduct}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Voeg product toe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} —{" "}
                          {formatCurrencyWithCode(product.unitPrice, watchedCurrencyCode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  const item = watchedItems[index]
                  if (!item) return null
                  const itemTotals = calculateItemTotal(item)

                  return (
                    <div key={field.id} className="space-y-4 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Omschrijving</FormLabel>
                              <FormControl>
                                <Input placeholder="Omschrijving..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-8 text-red-500 hover:text-red-600"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Aantal</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value) || 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Eenheid</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {UNITS.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prijs</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {currencySymbol}
                                  </span>
                                  <Input
                                    type="number"
                                    step={
                                      getCurrencyDecimals(watchedCurrencyCode) === 0
                                        ? "1"
                                        : "0.01"
                                    }
                                    min="0"
                                    className="pl-8"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.vatRate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>BTW</FormLabel>
                              {useKOR ? (
                                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                                  0% (KOR)
                                </div>
                              ) : (
                                <Select
                                  onValueChange={(v) => field.onChange(parseInt(v))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {VAT_RATES.map((rate) => (
                                      <SelectItem key={rate.value} value={rate.value}>
                                        {rate.value}%
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <FormLabel>Totaal</FormLabel>
                          <div className="flex h-10 items-center font-medium">
                            {formatCurrencyWithCode(itemTotals.subtotal, watchedCurrencyCode)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    append({
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      vatRate: useKOR ? 0 : 21,
                      unit: "uur",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Regel toevoegen
                </Button>
              </CardContent>
            </Card>

            {/* Notities */}
            <Card>
              <CardHeader>
                <CardTitle>Notities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notities op offerte</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Wordt getoond op de offerte..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interne notities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alleen voor intern gebruik..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column — Totalen & acties */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Totalen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotaal</span>
                  <span>{formatCurrencyWithCode(totals.subtotal, watchedCurrencyCode)}</span>
                </div>

                <Separator />

                {useKOR ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">BTW (KOR — vrijgesteld)</span>
                    <span>{formatCurrencyWithCode(0, watchedCurrencyCode)}</span>
                  </div>
                ) : (
                  <>
                    {Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
                      <div key={rate} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          BTW {rate}% over{" "}
                          {formatCurrencyWithCode(subtotal, watchedCurrencyCode)}
                        </span>
                        <span>{formatCurrencyWithCode(vatAmount, watchedCurrencyCode)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Totaal BTW</span>
                      <span>
                        {formatCurrencyWithCode(totals.vatAmount, watchedCurrencyCode)}
                      </span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Totaal</span>
                  <span>{formatCurrencyWithCode(totals.total, watchedCurrencyCode)}</span>
                </div>

                <Separator />

                <div className="space-y-2 pt-4">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "SENT"))}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Opslaan en Verzenden
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "DRAFT"))}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Opslaan als Concept
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
