"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"

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
import { loginSchema, type LoginFormData } from "@/lib/validations"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const form = useForm<LoginFormData & { twoFactorCode?: string }>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  })

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  async function onSubmit(data: LoginFormData & { twoFactorCode?: string }) {
    setIsLoading(true)
    setError(null)

    try {
      // First check if user exists and password is correct
      if (!requiresTwoFactor) {
        const response = await fetch("/api/auth/check-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        })

        if (response.ok) {
          const { requires2FA } = await response.json()
          if (requires2FA) {
            setRequiresTwoFactor(true)
            setEmail(data.email)
            setPassword(data.password) // Keep password for next attempt
            form.setValue("password", data.password)
            setIsLoading(false)
            return
          }
        }
      }

      // Now try to sign in
      const result = await signIn("credentials", {
        email: requiresTwoFactor ? email : data.email,
        password: requiresTwoFactor ? password : data.password,
        twoFactorCode: data.twoFactorCode || undefined,
        redirect: false,
      })

      if (result?.error) {
        // Handle specific error messages
        if (result.error === "CredentialsSignin") {
          if (requiresTwoFactor) {
            setError("Ongeldige 2FA code. Probeer het opnieuw.")
          } else {
            setError("Ongeldige inloggegevens. Controleer je email en wachtwoord.")
          }
        } else {
          setError(result.error)
        }
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError("Er is een fout opgetreden bij het inloggen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Inloggen</CardTitle>
          <CardDescription>
            Voer je inloggegevens in om toegang te krijgen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={requiresTwoFactor}
                        value={requiresTwoFactor ? email : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wachtwoord</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={requiresTwoFactor}
                        value={requiresTwoFactor ? password : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {requiresTwoFactor && (
                <FormField
                  control={form.control}
                  name="twoFactorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2FA Code</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          {...field}
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        Voer de 6-cijferige code in van je authenticator app
                      </p>
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {requiresTwoFactor ? "Verifieer" : "Inloggen"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Nog geen account? </span>
            <Link href="/register" className="text-primary hover:underline">
              Registreer hier
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
