"use client"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useTranslations } from "@/components/providers/locale-provider"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { companyInfoSchema, type CompanyInfoFormData } from "@/lib/validations"
import { updateCompanyInfo } from "./actions"
import { LogoUpload } from "./logo-upload"

interface BedrijfsgegevensFormProps {
  initialData: CompanyInfoFormData
}

export function BedrijfsgegevensForm({ initialData }: BedrijfsgegevensFormProps) {
  const { t } = useTranslations("settingsPage")
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.companyLogo || null)

  const form = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      ...initialData,
      companyLogo: logoUrl || undefined,
    },
  })

  async function onSubmit(data: CompanyInfoFormData) {
    setIsSubmitting(true)
    try {
      await updateCompanyInfo({
        ...data,
        companyLogo: logoUrl || null,
      })
      router.refresh()
      toast.success(t("companyFormSaveSuccess"))
    } catch (error) {
      console.error("Error saving company info:", error)
      toast.error(t("companyFormSaveError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogoUpload = (url: string) => {
    setLogoUrl(url || null)
    form.setValue("companyLogo", url || undefined)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <LogoUpload
              currentLogo={logoUrl}
              onUploadSuccess={handleLogoUpload}
            />

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
