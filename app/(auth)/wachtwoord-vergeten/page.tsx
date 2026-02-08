"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
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
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations"
import { requestPasswordReset } from "./actions"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestPasswordReset(data)

      if (result.error) {
        setError(result.error)
      } else {
        setIsSubmitted(true)
      }
    } catch {
      setError("Er is een fout opgetreden. Probeer het later opnieuw.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Wachtwoord vergeten
          </CardTitle>
          <CardDescription>
            {isSubmitted
              ? "Controleer je inbox"
              : "Vul je e-mailadres in om je wachtwoord te herstellen"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>
                  Als er een account bestaat met dit e-mailadres, ontvang je
                  binnen enkele minuten een e-mail met instructies om je
                  wachtwoord te herstellen. Controleer ook je spam-map.
                </p>
              </div>
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Terug naar inloggen
                </Link>
              </div>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mailadres</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="naam@voorbeeld.nl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verstuur herstel-link
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
