"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations"
import { changePassword } from "./actions"

export function WachtwoordForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: ChangePasswordFormData) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      await changePassword(data)
      setSuccess(true)
      form.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij wijzigen wachtwoord")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Wachtwoord wijzigen
        </CardTitle>
        <CardDescription>
          Wijzig je wachtwoord om je account te beveiligen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>
                  Je wachtwoord is succesvol gewijzigd.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Huidig wachtwoord</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Voer je huidige wachtwoord in"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nieuw wachtwoord</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Voer je nieuwe wachtwoord in"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimaal 6 karakters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bevestig nieuw wachtwoord</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Bevestig je nieuwe wachtwoord"
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
                Wachtwoord wijzigen
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
