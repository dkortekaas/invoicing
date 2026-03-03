"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { productSchema, type ProductFormData } from "@/lib/validations"
import { getCurrencySymbol } from "@/lib/currency/formatting"
import { createProduct, updateProduct } from "@/app/producten/actions"
import { useTranslations, useTranslatedUtils } from "@/components/providers/locale-provider"

interface ProductFormProps {
  product?: ProductFormData & { id: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ProductForm({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslations("productsPage")
  const { VAT_RATES, UNITS } = useTranslatedUtils()
  const currencySymbol = getCurrencySymbol("EUR")
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      name: "",
      description: "",
      unitPrice: 0,
      vatRate: 21,
      unit: "uur",
      isActive: true,
    },
  })

  async function onSubmit(data: ProductFormData) {
    setIsSubmitting(true)
    try {
      if (product?.id) {
        await updateProduct(product.id, data)
      } else {
        await createProduct(data)
      }
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error saving product:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? t("formEditTitle") : t("formNewTitle")}
          </DialogTitle>
          <DialogDescription>
            {product
              ? t("formEditDescription").replace("{name}", product.name)
              : t("formNewDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formNameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Consultancy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formDescriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("formDescriptionPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("formPriceLabel")}</FormLabel>
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
                          placeholder="0,00"
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("formUnitLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("formUnitPlaceholder")} />
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
            </div>

            <FormField
              control={form.control}
              name="vatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formVatLabel")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("formVatPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VAT_RATES.map((rate) => (
                        <SelectItem key={rate.value} value={rate.value}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("formVatDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("actionCancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {product ? t("actionSave") : t("actionAdd")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
