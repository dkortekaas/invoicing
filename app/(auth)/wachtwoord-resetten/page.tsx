"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Logo from "@/components/marketing/logo"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations"
import { resetPassword } from "./actions"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await resetPassword(data)

      if (result.error) {
        setError(result.error)
      } else {
        setIsSuccess(true)
      }
    } catch {
      setError("Er is een fout opgetreden. Probeer het later opnieuw.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4">
        <Logo />
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Ongeldige link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                Deze link is ongeldig. Vraag een nieuwe herstel-link aan.
              </div>
              <div className="text-center">
                <Link
                  href="/wachtwoord-vergeten"
                  className="text-sm text-primary hover:underline"
                >
                  Nieuw verzoek indienen
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isSuccess ? "Wachtwoord gewijzigd" : "Nieuw wachtwoord instellen"}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? "Je kunt nu inloggen met je nieuwe wachtwoord"
              : "Kies een nieuw wachtwoord voor je account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>
                  Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met
                  je nieuwe wachtwoord.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Ga naar inloggen</Link>
              </Button>
            </div>
          ) : (
            <>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nieuw wachtwoord</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Minimaal 6 karakters"
                            {...field}
                          />
                        </FormControl>
                        <PasswordStrengthIndicator password={form.watch("password")} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bevestig wachtwoord</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Herhaal je wachtwoord"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <input type="hidden" {...form.register("token")} />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Wachtwoord opslaan
                  </Button>
                </form>
              </Form>

              <div className="mt-4 text-center text-sm">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Terug naar inloggen
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
