"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

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
import { Info } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { creditNoteSchema, type CreditNoteFormData, type CreditNoteReason } from "@/lib/validations"
import {
  formatCurrencyWithCode,
  roundToTwo,
  cn,
} from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency/formatting"
import { createCreditNote, updateCreditNote } from "@/app/creditnotas/actions"
import { CurrencySelector } from "@/components/currency/currency-selector"
import { useTranslations, useTranslatedUtils } from "@/components/providers/locale-provider"

const REASON_KEY_MAP: Record<string, string> = {
  PRICE_CORRECTION: "reasonPriceCorrection",
  QUANTITY_CORRECTION: "reasonQuantityCorrection",
  RETURN: "reasonReturn",
  CANCELLATION: "reasonCancellation",
  DISCOUNT_AFTER: "reasonDiscountAfter",
  VAT_CORRECTION: "reasonVatCorrection",
  DUPLICATE_INVOICE: "reasonDuplicateInvoice",
  GOODWILL: "reasonGoodwill",
  OTHER: "reasonOther",
}

interface Customer {
  id: string
  name: string
  companyName?: string | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  currencyCode?: string
}

interface CreditNoteFormProps {
  creditNote?: CreditNoteFormData & { id: string; creditNoteNumber: string; currencyCode?: string }
  customers: Customer[]
  invoices?: Invoice[]
  preselectedCustomerId?: string
  preselectedInvoice?: Invoice
  defaultItems?: CreditNoteFormData["items"]
  useKOR?: boolean
}

export function CreditNoteForm({
  creditNote,
  customers,
  invoices = [],
  preselectedCustomerId,
  preselectedInvoice,
  defaultItems,
  useKOR = false,
}: CreditNoteFormProps) {
  const router = useRouter()
  const { t } = useTranslations("creditNotesPage")
  const { VAT_RATES, UNITS, CREDIT_NOTE_REASONS } = useTranslatedUtils()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = new Date()

  const form = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: creditNote ? {
      ...creditNote,
      currencyCode: creditNote.currencyCode ?? preselectedInvoice?.currencyCode ?? "EUR",
    } : {
      customerId: preselectedCustomerId || "",
      creditNoteDate: today,
      reason: preselectedInvoice ? "CANCELLATION" : ("PRICE_CORRECTION" as CreditNoteReason),
      originalInvoiceId: preselectedInvoice?.id || null,
      originalInvoiceNumber: preselectedInvoice?.invoiceNumber || null,
      description: preselectedInvoice
        ? t("formDefaultDescription").replace("{number}", preselectedInvoice.invoiceNumber)
        : "",
      notes: "",
      internalNotes: "",
      currencyCode: preselectedInvoice?.currencyCode ?? "EUR",
      items: defaultItems || [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          vatRate: useKOR ? 0 : 21,
          unit: "uur",
          originalInvoiceItemId: null,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Watch all items for calculations
  const watchedItems = form.watch("items")
  const watchedReason = form.watch("reason")
  const watchedCustomerId = form.watch("customerId")
  const watchedCurrencyCode = form.watch("currencyCode") || "EUR"
  const currencySymbol = getCurrencySymbol(watchedCurrencyCode)

  // Filter invoices by selected customer
  const customerInvoices = invoices.filter(
    (_inv) => !watchedCustomerId || invoices.length === 0
  )

  // Calculate totals (use 0% VAT when KOR applies)
  const calculateItemTotal = (item: (typeof watchedItems)[0]) => {
    const effectiveVatRate = useKOR ? 0 : item.vatRate
    const subtotal = roundToTwo(item.quantity * item.unitPrice)
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
    { subtotal: 0, vatAmount: 0, total: 0 }
  )

  // Group VAT by rate (use 0 when KOR)
  const vatByRate = watchedItems.reduce((acc, item) => {
    const { subtotal, vatAmount } = calculateItemTotal(item)
    const rate = (useKOR ? 0 : item.vatRate).toString()
    if (!acc[rate]) {
      acc[rate] = { subtotal: 0, vatAmount: 0 }
    }
    acc[rate].subtotal = roundToTwo(acc[rate].subtotal + subtotal)
    acc[rate].vatAmount = roundToTwo(acc[rate].vatAmount + vatAmount)
    return acc
  }, {} as Record<string, { subtotal: number; vatAmount: number }>)

  async function onSubmit(data: CreditNoteFormData, status: "DRAFT" | "FINAL" = "DRAFT") {
    // When KOR applies, force all items to 0% VAT
    const submitData = useKOR
      ? { ...data, items: data.items.map((item) => ({ ...item, vatRate: 0 })) }
      : data

    setIsSubmitting(true)
    try {
      if (creditNote?.id) {
        await updateCreditNote(creditNote.id, submitData, status)
      } else {
        await createCreditNote(submitData, status)
      }
      router.push("/creditnotas")
      router.refresh()
    } catch (error) {
      console.error("Error saving credit note:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {useKOR && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t("formKorTitle")}</AlertTitle>
            <AlertDescription>
              {t("formKorDesc").split(t("formKorSettings"))[0]}
              <a href="/instellingen" className="underline font-medium">{t("formKorSettings")}</a>
              {t("formKorDesc").split(t("formKorSettings"))[1]}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Customer & Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t("formCardCustomerDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("formSelectCustomer")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!!preselectedCustomerId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("formSelectCustomerPlaceholder")} />
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

                  <FormField
                    control={form.control}
                    name="creditNoteDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("formDateLabel")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "d MMMM yyyy", { locale: nl })
                                ) : (
                                  <span>{t("formDatePlaceholder")}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={nl}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="currencyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("formCurrencyLabel")}</FormLabel>
                        <FormControl>
                          <CurrencySelector
                            value={field.value || "EUR"}
                            onChange={field.onChange}
                            showRate={field.value !== "EUR"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("formReasonLabel")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("formReasonPlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CREDIT_NOTE_REASONS.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {t(REASON_KEY_MAP[reason.value] ?? "reasonOther")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {customerInvoices.length > 0 && (
                    <FormField
                      control={form.control}
                      name="originalInvoiceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("formOriginalInvoiceLabel")}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              const invoice = invoices.find((i) => i.id === value)
                              if (invoice) {
                                form.setValue("originalInvoiceNumber", invoice.invoiceNumber)
                              }
                            }}
                            defaultValue={field.value ?? undefined}
                            disabled={!!preselectedInvoice}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("formOriginalInvoicePlaceholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customerInvoices.map((invoice) => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                  {invoice.invoiceNumber} - {formatCurrencyWithCode(invoice.total, invoice.currencyCode || "EUR")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("formDescriptionLabel")}{watchedReason === "OTHER" && " *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("formDescriptionPlaceholder")}
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

            {/* Credit note items */}
            <Card>
              <CardHeader>
                <CardTitle>{t("formItemsCardTitle")}</CardTitle>
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
                              <FormLabel>{t("formItemDescription")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("formItemDescriptionPlaceholder")} {...field} />
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
                              <FormLabel>{t("formItemQuantity")}</FormLabel>
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
                              <FormLabel>{t("formItemUnit")}</FormLabel>
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
                              <FormLabel>{t("formItemPrice")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {currencySymbol}
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
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
                              <FormLabel>{t("formItemVat")}</FormLabel>
                              {useKOR ? (
                                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                                  {t("formKorVatDisplay")}
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
                          <FormLabel>{t("formItemTotal")}</FormLabel>
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
                      originalInvoiceItemId: null,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("formAddLine")}
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t("formNotesCardTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("formNotesLabel")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("formNotesPlaceholder")}
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
                      <FormLabel>{t("formInternalNotesLabel")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("formInternalNotesPlaceholder")}
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

          {/* Right column - Totals & Actions */}
          <div className="space-y-6">
            {/* Totals summary */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{t("formCreditAmountCardTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("formSubtotal")}</span>
                  <span className="text-red-600">-{formatCurrencyWithCode(totals.subtotal, watchedCurrencyCode)}</span>
                </div>

                <Separator />

                {/* VAT breakdown by rate */}
                {useKOR ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("formVatKorExempt")}</span>
                    <span className="text-red-600">-{formatCurrencyWithCode(0, watchedCurrencyCode)}</span>
                  </div>
                ) : (
                  <>
                    {Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
                      <div key={rate} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("formVatLine").replace("{rate}", rate).replace("{amount}", formatCurrencyWithCode(subtotal, watchedCurrencyCode))}
                        </span>
                        <span className="text-red-600">-{formatCurrencyWithCode(vatAmount, watchedCurrencyCode)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("formTotalVat")}</span>
                      <span className="text-red-600">-{formatCurrencyWithCode(totals.vatAmount, watchedCurrencyCode)}</span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>{t("formCreditTotal")}</span>
                  <span className="text-red-600">-{formatCurrencyWithCode(totals.total, watchedCurrencyCode)}</span>
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "FINAL"))}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("formSaveFinal")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "DRAFT"))}
                  >
                    {t("formSaveDraft")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    {t("formCancel")}
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
