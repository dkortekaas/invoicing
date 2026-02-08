"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function NewsletterStatus() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "info"
  const message =
    searchParams.get("message") || "Bedankt voor je interesse in onze nieuwsbrief."

  const icon =
    type === "success" ? (
      <CheckCircle2 className="h-12 w-12 text-green-600" />
    ) : type === "error" ? (
      <XCircle className="h-12 w-12 text-red-600" />
    ) : (
      <Info className="h-12 w-12 text-blue-600" />
    )

  const bgColor =
    type === "success"
      ? "bg-green-50"
      : type === "error"
        ? "bg-red-50"
        : "bg-blue-50"

  const textColor =
    type === "success"
      ? "text-green-800"
      : type === "error"
        ? "text-red-800"
        : "text-blue-800"

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">{icon}</div>
          <CardTitle className="text-xl">Nieuwsbrief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-md ${bgColor} p-4 text-sm ${textColor}`}>
            {message}
          </div>
          <div className="text-center">
            <Button asChild variant="outline">
              <Link href="/">Terug naar de homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewsletterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      }
    >
      <NewsletterStatus />
    </Suspense>
  )
}
