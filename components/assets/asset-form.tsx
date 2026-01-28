"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  assetSchema,
  type AssetFormData,
  assetCategories,
  depreciationMethods,
} from "@/lib/validations"
import { createAsset, updateAsset } from "@/app/activa/actions"

const CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: "Apparatuur/Machines",
  VEHICLE: "Voertuigen",
  FURNITURE: "Inventaris/Meubilair",
  SOFTWARE: "Software/Licenties",
  BUILDING: "Gebouwen",
  INTANGIBLE: "Immaterieel",
  OTHER: "Overig",
}

const DEPRECIATION_METHOD_LABELS: Record<string, string> = {
  LINEAR: "Lineair (gelijke bedragen)",
  DEGRESSIVE: "Degressief (dalende bedragen)",
}

const DEFAULT_USEFUL_LIFE: Record<string, number> = {
  EQUIPMENT: 5,
  VEHICLE: 5,
  FURNITURE: 10,
  SOFTWARE: 3,
  BUILDING: 30,
  INTANGIBLE: 5,
  OTHER: 5,
}

interface AssetFormProps {
  asset?: {
    id: string
    name: string
    description: string | null
    category: string
    purchaseDate: Date
    purchasePrice: number
    supplier: string | null
    usefulLifeYears: number
    residualValue: number
    depreciationMethod: string
  }
}

export function AssetForm({ asset }: AssetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset
      ? {
          name: asset.name,
          description: asset.description,
          category: asset.category as AssetFormData["category"],
          purchaseDate: new Date(asset.purchaseDate),
          purchasePrice: asset.purchasePrice,
          supplier: asset.supplier,
          usefulLifeYears: asset.usefulLifeYears,
          residualValue: asset.residualValue,
          depreciationMethod: asset.depreciationMethod as AssetFormData["depreciationMethod"],
        }
      : {
          name: "",
          description: null,
          category: "EQUIPMENT",
          purchaseDate: new Date(),
          purchasePrice: 0,
          supplier: null,
          usefulLifeYears: 5,
          residualValue: 0,
          depreciationMethod: "LINEAR",
        },
  })

  const watchCategory = form.watch("category")
  const watchPurchasePrice = form.watch("purchasePrice")
  const watchResidualValue = form.watch("residualValue")
  const watchUsefulLife = form.watch("usefulLifeYears")

  // Calculate yearly depreciation preview
  const yearlyDepreciation =
    watchUsefulLife > 0
      ? Math.round(((watchPurchasePrice - watchResidualValue) / watchUsefulLife) * 100) / 100
      : 0

  async function onSubmit(data: AssetFormData) {
    setIsSubmitting(true)
    try {
      if (asset) {
        await updateAsset(asset.id, data)
        toast.success("Activum bijgewerkt")
      } else {
        await createAsset(data)
        toast.success("Activum aangemaakt")
      }
      router.push("/activa")
      router.refresh()
    } catch (error) {
      console.error("Error saving asset:", error)
      toast.error("Fout bij opslaan activum")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update useful life when category changes
  const handleCategoryChange = (value: string) => {
    form.setValue("category", value as AssetFormData["category"])
    if (!asset) {
      // Only set default for new assets
      const defaultLife = DEFAULT_USEFUL_LIFE[value] || 5
      form.setValue("usefulLifeYears", defaultLife)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basisgegevens</CardTitle>
            <CardDescription>
              Algemene informatie over het bedrijfsmiddel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naam *</FormLabel>
                  <FormControl>
                    <Input placeholder="Bijv. MacBook Pro 16 inch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Extra details over het activum"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie *</FormLabel>
                    <Select
                      onValueChange={handleCategoryChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leverancier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Naam leverancier"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Info */}
        <Card>
          <CardHeader>
            <CardTitle>Aanschaf</CardTitle>
            <CardDescription>Datum en prijs van aanschaf</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Aankoopdatum *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: nl })
                            ) : (
                              <span>Kies een datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={nl}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aanschafprijs (excl. BTW) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          €
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-8"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Depreciation */}
        <Card>
          <CardHeader>
            <CardTitle>Afschrijving</CardTitle>
            <CardDescription>
              Instellingen voor de afschrijving van het activum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="usefulLifeYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Afschrijvingstermijn *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          className="w-20"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                        <span className="text-muted-foreground">jaar</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Gebruikelijke termijn voor {CATEGORY_LABELS[watchCategory]?.toLowerCase()}:{" "}
                      {DEFAULT_USEFUL_LIFE[watchCategory]} jaar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="residualValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restwaarde</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          €
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-8"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Geschatte waarde na afschrijvingstermijn
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depreciationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Afschrijvingsmethode *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {depreciationMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {DEPRECIATION_METHOD_LABELS[method]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Depreciation Preview */}
            {watchPurchasePrice > 0 && (
              <div className="rounded-lg bg-muted p-4 mt-4">
                <h4 className="font-medium mb-2">Afschrijving preview</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Af te schrijven bedrag
                    </span>
                    <p className="font-medium">
                      € {(watchPurchasePrice - watchResidualValue).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Per jaar</span>
                    <p className="font-medium">
                      € {yearlyDepreciation.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Termijn</span>
                    <p className="font-medium">{watchUsefulLife} jaar</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuleren
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {asset ? "Opslaan" : "Activum toevoegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
