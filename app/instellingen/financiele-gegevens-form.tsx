"use client"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/components/providers/locale-provider"
import { financialInfoSchema, type FinancialInfoFormData } from "@/lib/validations"
import { updateFinancialInfo } from "./actions"

interface FinancieleGegevensFormProps {
  initialData: FinancialInfoFormData
}

export function FinancieleGegevensForm({ initialData }: FinancieleGegevensFormProps) {
  const router = useRouter()
  const { t } = useTranslations("settingsPage")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FinancialInfoFormData>({
    resolver: zodResolver(financialInfoSchema),
    defaultValues: initialData,
  })

  async function onSubmit(data: FinancialInfoFormData) {
    setIsSubmitting(true)
    try {
      await updateFinancialInfo(data)
      router.refresh()
      toast.success(t("financialFormSaveSuccess"))
    } catch (error) {
      console.error("Error saving financial info:", error)
      toast.error(t("financialFormSaveError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("companySettingsFormFinancialTitle")}</CardTitle>
            <CardDescription>
              {t("companySettingsFormFinancialDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormVatNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("companySettingsFormVatPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("companySettingsFormVatHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kvkNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormKvkNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("companySettingsFormKvkPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>{t("companySettingsFormKvkHelp")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companySettingsFormIban")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("companySettingsFormIbanPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("companySettingsFormIbanHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companySettingsFormInvoicePrefix")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("companySettingsFormInvoicePrefixPlaceholder")} {...field} className="w-32" />
                  </FormControl>
                  <FormDescription>
                    {t("companySettingsFormInvoicePrefixHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("companySettingsFormSave")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
