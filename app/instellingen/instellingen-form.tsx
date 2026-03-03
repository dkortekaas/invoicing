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
import { Separator } from "@/components/ui/separator"
import { useTranslations } from "@/components/providers/locale-provider"
import { companySettingsSchema, type CompanySettingsFormData } from "@/lib/validations"
import { updateCompanySettings } from "./actions"

interface InstellingenFormProps {
  initialData: CompanySettingsFormData
}

export function InstellingenForm({ initialData }: InstellingenFormProps) {
  const router = useRouter()
  const { t } = useTranslations("settingsPage")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: initialData,
  })

  async function onSubmit(data: CompanySettingsFormData) {
    setIsSubmitting(true)
    try {
      await updateCompanySettings(data)
      router.refresh()
      toast.success(t("companySettingsFormSaveSuccess"))
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error(t("companySettingsFormSaveError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Bedrijfsgegevens */}
        <Card>
          <CardHeader>
            <CardTitle>{t("companySettingsFormTitle")}</CardTitle>
            <CardDescription>
              {t("companySettingsFormDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companySettingsFormCompanyName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("companySettingsFormCompanyNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormEmail")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("companySettingsFormEmailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormPhone")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("companySettingsFormPhonePlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companySettingsFormAddress")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("companySettingsFormAddressPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="companyPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormPostalCode")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("companySettingsFormPostalCodePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormCity")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("companySettingsFormCityPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companySettingsFormCountry")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financiële gegevens */}
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
          </CardContent>
        </Card>

        {/* Facturatie instellingen */}
        <Card>
          <CardHeader>
            <CardTitle>{t("companySettingsFormInvoicingTitle")}</CardTitle>
            <CardDescription>
              {t("companySettingsFormInvoicingDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("companySettingsFormSave")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
