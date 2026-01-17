"use client"

import { useForm } from "react-hook-form"
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
import { financialInfoSchema, type FinancialInfoFormData } from "@/lib/validations"
import { updateFinancialInfo } from "./actions"

interface FinancieleGegevensFormProps {
  initialData: FinancialInfoFormData
}

export function FinancieleGegevensForm({ initialData }: FinancieleGegevensFormProps) {
  const router = useRouter()
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
    } catch (error) {
      console.error("Error saving financial info:", error)
      alert("Fout bij opslaan financiële gegevens")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Financiële gegevens</CardTitle>
            <CardDescription>
              BTW, KvK en bankgegevens voor je facturen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BTW-nummer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="NL123456789B01"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Nederlands formaat: NL + 9 cijfers + B + 2 cijfers
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
                    <FormLabel>KvK-nummer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345678"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>8 cijfers</FormDescription>
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
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NL91ABNA0417164300"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Wordt getoond op facturen voor betalingen
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
                  <FormLabel>Factuur prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="FAC" {...field} className="w-32" />
                  </FormControl>
                  <FormDescription>
                    Voorvoegsel voor factuurnummers (bijv. FAC-2025-0001)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
