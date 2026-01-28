"use client"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Info } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  fiscalSettingsSchema,
  type FiscalSettingsFormData,
  businessTypes,
  homeOfficeTypes,
} from "@/lib/validations"
import { updateFiscalSettings } from "./actions"

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  EENMANSZAAK: "Eenmanszaak",
  VOF: "Vennootschap onder firma (VOF)",
  MAATSCHAP: "Maatschap",
  BV: "Besloten vennootschap (BV)",
}

const HOME_OFFICE_TYPE_LABELS: Record<string, string> = {
  INDEPENDENT: "Zelfstandige werkruimte",
  NON_INDEPENDENT: "Niet-zelfstandige werkruimte",
}

interface FiscaalFormProps {
  initialData: FiscalSettingsFormData
}

export function FiscaalForm({ initialData }: FiscaalFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FiscalSettingsFormData>({
    resolver: zodResolver(fiscalSettingsSchema),
    defaultValues: initialData,
  })

  const watchHoursTracked = form.watch("hoursTracked")
  const watchIsStarter = form.watch("isStarter")
  const watchHasHomeOffice = form.watch("hasHomeOffice")
  const watchHasBusinessCar = form.watch("hasBusinessCar")
  const watchBusinessType = form.watch("businessType")

  async function onSubmit(data: FiscalSettingsFormData) {
    setIsSubmitting(true)
    try {
      await updateFiscalSettings(data)
      router.refresh()
      toast.success("Fiscale instellingen opgeslagen")
    } catch (error) {
      console.error("Error saving fiscal settings:", error)
      toast.error("Fout bij opslaan fiscale instellingen")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Rechtsvorm */}
          <Card>
            <CardHeader>
              <CardTitle>Rechtsvorm</CardTitle>
              <CardDescription>
                De rechtsvorm van je onderneming bepaalt welke aftrekposten van
                toepassing zijn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rechtsvorm</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder="Selecteer rechtsvorm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {BUSINESS_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchBusinessType === "BV" && (
                        <span className="text-amber-600">
                          Let op: Bij een BV gelden andere fiscale regels.
                          Sommige aftrekposten zijn niet van toepassing.
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Kleineondernemersregeling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Kleineondernemersregeling (KOR)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Met de KOR hoef je geen BTW te berekenen en af te dragen.
                      Je kunt ook geen BTW terugvragen op je inkopen. Je kosten
                      zijn wel gewoon aftrekbaar voor de inkomstenbelasting.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                BTW-vrijstelling voor kleine ondernemers met minder dan €20.000
                omzet per jaar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="useKOR"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">KOR toepassen</FormLabel>
                      <FormDescription>
                        Ik maak gebruik van de kleineondernemersregeling en ben
                        vrijgesteld van BTW
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Urencriterium */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Urencriterium
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Om in aanmerking te komen voor de zelfstandigenaftrek,
                      startersaftrek en MKB-winstvrijstelling moet je minimaal
                      1.225 uur per jaar aan je onderneming besteden.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Het urencriterium bepaalt of je recht hebt op ondernemersaftrek
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hoursTracked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Uren uit tijdregistratie
                      </FormLabel>
                      <FormDescription>
                        Gebruik uren uit de tijdregistratie module voor het
                        urencriterium
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!watchHoursTracked && (
                <FormField
                  control={form.control}
                  name="manualHoursPerYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geschatte uren per jaar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1400"
                          className="w-32"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : null
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Vul handmatig het geschatte aantal uren in als je geen
                        tijdregistratie gebruikt. Minimaal 1.225 uur voor
                        urencriterium.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Startersaftrek */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Startersaftrek
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Als starter kun je maximaal 3 jaar startersaftrek krijgen
                      bovenop de zelfstandigenaftrek. Je moet wel voldoen aan
                      het urencriterium.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Extra aftrek voor startende ondernemers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isStarter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Ik ben een starter
                      </FormLabel>
                      <FormDescription>
                        Je bent starter als je in de afgelopen 5 jaar niet meer
                        dan 2 jaar ondernemer bent geweest
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchIsStarter && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="starterYearsUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jaren startersaftrek gebruikt</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">0 jaar</SelectItem>
                            <SelectItem value="1">1 jaar</SelectItem>
                            <SelectItem value="2">2 jaar</SelectItem>
                            <SelectItem value="3">3 jaar (maximum)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="firstStarterYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eerste jaar startersaftrek</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2024"
                            className="w-32"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : null
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Werkruimte thuis */}
          <Card>
            <CardHeader>
              <CardTitle>Werkruimte thuis</CardTitle>
              <CardDescription>
                Kosten voor een werkruimte aan huis kunnen deels aftrekbaar zijn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasHomeOffice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Werkruimte aan huis
                      </FormLabel>
                      <FormDescription>
                        Ik heb een werkruimte in mijn eigen woning
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchHasHomeOffice && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="homeOfficeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type werkruimte</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {homeOfficeTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {HOME_OFFICE_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Een zelfstandige werkruimte heeft een eigen ingang en
                          sanitair
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homeOfficePercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage zakelijk gebruik</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              className="w-24"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null
                                )
                              }
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Deel van de woning dat zakelijk wordt gebruikt
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zakelijke auto */}
          <Card>
            <CardHeader>
              <CardTitle>Zakelijke auto</CardTitle>
              <CardDescription>
                Instellingen voor bijtelling en zakelijk gebruik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasBusinessCar"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto van de zaak
                      </FormLabel>
                      <FormDescription>
                        Ik heb een auto op de balans van mijn onderneming
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchHasBusinessCar && (
                <FormField
                  control={form.control}
                  name="carPrivateUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage privé gebruik</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            className="w-24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Boven 500 km privé per jaar geldt de bijtelling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Fiscale Oudedagsreserve */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Fiscale Oudedagsreserve (FOR)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Met de FOR kun je een deel van je winst reserveren voor
                      later en nu minder belasting betalen. Je moet wel voldoen
                      aan het urencriterium en AOW-leeftijd nog niet bereikt
                      hebben.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Sparen voor je pensioen met belastingvoordeel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="useFOR"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">FOR toepassen</FormLabel>
                      <FormDescription>
                        Reserveer maximaal 9,44% van de winst (max. 10.083) voor
                        de fiscale oudedagsreserve
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Opslaan
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  )
}
