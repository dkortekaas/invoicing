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
import { useTranslations } from "@/components/providers/locale-provider"
import { profileSchema, type ProfileFormData } from "@/lib/validations"
import { updateProfile } from "./actions"

interface ProfielFormProps {
  initialData: ProfileFormData
}

export function ProfielForm({ initialData }: ProfielFormProps) {
  const router = useRouter()
  const { t } = useTranslations("settingsPage")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  })

  async function onSubmit(data: ProfileFormData) {
    setIsSubmitting(true)
    try {
      await updateProfile(data)
      router.refresh()
      toast.success(t("profileFormSaveSuccess"))
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error(t("profileFormSaveError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("profileFormTitle")}</CardTitle>
            <CardDescription>
              {t("profileFormDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profileFormName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("profileFormPlaceholderName")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profileFormEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("profileFormPlaceholderEmail")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("profileFormSave")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
