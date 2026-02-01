"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations"
import {
  formatCurrencyWithCode,
  VAT_RATES,
  UNITS,
  calculateDueDate,
  roundToTwo,
  cn,
  getCurrencyDecimals,
} from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency/formatting"
import { createInvoice, updateInvoice } from "@/app/facturen/actions"
import { CurrencySelector } from "@/components/currency/currency-selector"
import { ExchangeRateDisplay } from "@/components/currency/exchange-rate-display"

// Types
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

interface InvoiceFormProps {
  invoice?: InvoiceFormData & { id: string; invoiceNumber: string; currencyCode?: string }
  customers: Customer[]
  products: Product[]
}

export function InvoiceForm({ invoice, customers, products }: InvoiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setSelectedCustomer] = useState<Customer | null>(null)

  const today = new Date()
  const defaultDueDate = calculateDueDate(today, 30)

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      ...invoice,
      currencyCode: invoice.currencyCode ?? "EUR",
    } : {
      customerId: "",
      invoiceDate: today,
      dueDate: defaultDueDate,
      reference: "",
      notes: "",
      internalNotes: "",
      currencyCode: "EUR",
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          vatRate: 21,
          unit: "uur",
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
  const watchedCustomerId = form.watch("customerId")
  const watchedCurrencyCode = form.watch("currencyCode") || "EUR"
  const currencySymbol = getCurrencySymbol(watchedCurrencyCode)

  // Update due date when customer changes
  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers.find((c) => c.id === watchedCustomerId)
      if (customer) {
        setSelectedCustomer(customer)
        const invoiceDate = form.getValues("invoiceDate")
        const newDueDate = calculateDueDate(invoiceDate, customer.paymentTermDays)
        form.setValue("dueDate", newDueDate)
      }
    }
  }, [watchedCustomerId, customers, form])

  // Calculate totals
  const calculateItemTotal = (item: (typeof watchedItems)[0]) => {
    const subtotal = roundToTwo(item.quantity * item.unitPrice)
    const vatAmount = roundToTwo(subtotal * (item.vatRate / 100))
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

  // Group VAT by rate
  const vatByRate = watchedItems.reduce((acc, item) => {
    const { subtotal, vatAmount } = calculateItemTotal(item)
    const rate = item.vatRate.toString()
    if (!acc[rate]) {
      acc[rate] = { subtotal: 0, vatAmount: 0 }
    }
    acc[rate].subtotal = roundToTwo(acc[rate].subtotal + subtotal)
    acc[rate].vatAmount = roundToTwo(acc[rate].vatAmount + vatAmount)
    return acc
  }, {} as Record<string, { subtotal: number; vatAmount: number }>)

  // Add product to items
  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      append({
        description: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
        unit: product.unit,
      })
    }
  }

  async function onSubmit(data: InvoiceFormData, status: "DRAFT" | "SENT" = "DRAFT") {
    setIsSubmitting(true)
    try {
      if (invoice?.id) {
        await updateInvoice(invoice.id, data, status)
      } else {
        await createInvoice(data, status)
      }
      router.push("/facturen")
      router.refresh()
    } catch (error) {
      console.error("Error saving invoice:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Customer & Dates */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer selection */}
            <Card>
              <CardHeader>
                <CardTitle>Klant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecteer klant *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Factuurdatum</FormLabel>
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
                                  <span>Selecteer datum</span>
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

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vervaldatum</FormLabel>
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
                                  <span>Selecteer datum</span>
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

                <div className="grid grid-cols-2 gap-4">
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

                {/* Exchange rate info for non-EUR currencies */}
                {watchedCurrencyCode && watchedCurrencyCode !== "EUR" && (
                  <ExchangeRateDisplay
                    toCurrency={watchedCurrencyCode}
                    className="mt-4"
                  />
                )}
              </CardContent>
            </Card>

            {/* Invoice items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Factuurregels</CardTitle>
                {products.length > 0 && (
                  <Select onValueChange={addProduct}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Voeg product toe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrencyWithCode(product.unitPrice, watchedCurrencyCode)}
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

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
                                    step={getCurrencyDecimals(watchedCurrencyCode) === 0 ? "1" : "0.01"}
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
                      vatRate: 21,
                      unit: "uur",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Regel toevoegen
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
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
                      <FormLabel>Notities op factuur</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Wordt getoond op de factuur..."
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

          {/* Right column - Totals & Actions */}
          <div className="space-y-6">
            {/* Totals summary */}
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

                {/* VAT breakdown by rate */}
                {Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
                  <div key={rate} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      BTW {rate}% over {formatCurrencyWithCode(subtotal, watchedCurrencyCode)}
                    </span>
                    <span>{formatCurrencyWithCode(vatAmount, watchedCurrencyCode)}</span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Totaal BTW</span>
                  <span>{formatCurrencyWithCode(totals.vatAmount, watchedCurrencyCode)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Totaal</span>
                  <span>{formatCurrencyWithCode(totals.total, watchedCurrencyCode)}</span>
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "SENT"))}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Opslaan en Verzenden
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "DRAFT"))}
                  >
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
