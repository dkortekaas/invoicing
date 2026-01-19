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
      toast.success("Bedrijfsgegevens opgeslagen")
    } catch (error) {
      console.error("Error saving company info:", error)
      toast.error("Fout bij opslaan bedrijfsgegevens")
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
            <CardTitle>Bedrijfsgegevens</CardTitle>
            <CardDescription>
              Deze gegevens worden getoond op je facturen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrijfsnaam *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mijn Bedrijf B.V." {...field} />
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
                    <FormLabel>E-mailadres *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="info@bedrijf.nl"
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
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="020-1234567"
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
                  <FormLabel>Adres *</FormLabel>
                  <FormControl>
                    <Input placeholder="Straatnaam 123" {...field} />
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
                    <FormLabel>Postcode *</FormLabel>
                    <FormControl>
                      <Input placeholder="1234 AB" {...field} />
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
                    <FormLabel>Plaats *</FormLabel>
                    <FormControl>
                      <Input placeholder="Amsterdam" {...field} />
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
                    <FormLabel>Land</FormLabel>
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
                Opslaan
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
