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
import { useTranslations } from "@/components/providers/locale-provider"
import {
  fiscalSettingsSchema,
  type FiscalSettingsFormData,
  businessTypes,
  homeOfficeTypes,
} from "@/lib/validations"
import { updateFiscalSettings } from "./actions"

const BUSINESS_TYPE_KEYS: Record<string, string> = {
  EENMANSZAAK: "fiscalFormBusinessTypeEenmanszaak",
  VOF: "fiscalFormBusinessTypeVof",
  MAATSCHAP: "fiscalFormBusinessTypeMaatschap",
  BV: "fiscalFormBusinessTypeBv",
}

const HOME_OFFICE_TYPE_KEYS: Record<string, string> = {
  INDEPENDENT: "fiscalFormHomeOfficeTypeIndependent",
  NON_INDEPENDENT: "fiscalFormHomeOfficeTypeNonIndependent",
}

interface FiscaalFormProps {
  initialData: FiscalSettingsFormData
}

export function FiscaalForm({ initialData }: FiscaalFormProps) {
  const router = useRouter()
  const { t } = useTranslations("settingsPage")
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
      toast.success(t("fiscalFormSaveSuccess"))
    } catch (error) {
      console.error("Error saving fiscal settings:", error)
      toast.error(t("fiscalFormSaveError"))
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
              <CardTitle>{t("fiscalFormLegalFormTitle")}</CardTitle>
              <CardDescription>
                {t("fiscalFormLegalFormDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fiscalFormLegalFormLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder={t("fiscalFormLegalFormPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((type) => {
                          const key = BUSINESS_TYPE_KEYS[type]
                          return (
                            <SelectItem key={type} value={type}>
                              {key ? t(key) : type}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchBusinessType === "BV" && (
                        <span className="text-amber-600">
                          {t("fiscalFormLegalFormBvWarning")}
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
                {t("fiscalFormKorTitle")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t("fiscalFormKorTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {t("fiscalFormKorDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="useKOR"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("fiscalFormKorApply")}</FormLabel>
                      <FormDescription>
                        {t("fiscalFormKorApplyDesc")}
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
                      <FormLabel>{t("fiscalFormManualHours")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("fiscalFormManualHoursPlaceholder")}
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
                        {t("fiscalFormManualHoursDesc")}
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
                {t("fiscalFormStarterTitle")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t("fiscalFormStarterTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {t("fiscalFormStarterDesc")}
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
                        {t("fiscalFormStarterLabel")}
                      </FormLabel>
                      <FormDescription>
                        {t("fiscalFormStarterDesc2")}
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
              <CardTitle>{t("fiscalFormHomeOfficeTitle")}</CardTitle>
              <CardDescription>
                {t("fiscalFormHomeOfficeDesc")}
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
                        {t("fiscalFormHomeOfficeLabel")}
                      </FormLabel>
                      <FormDescription>
                        {t("fiscalFormHomeOfficeDesc2")}
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
                            {homeOfficeTypes.map((type) => {
                              const key = HOME_OFFICE_TYPE_KEYS[type]
                              return (
                                <SelectItem key={type} value={type}>
                                  {key ? t(key) : type}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("fiscalFormHomeOfficeTypeHelp")}
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
                          {t("fiscalFormHomeOfficePercentageDesc")}
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
                      <FormLabel>{t("fiscalFormCarPrivateUsage")}</FormLabel>
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
                        {t("fiscalFormCarPrivateUsageDesc")}
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
              {t("fiscalFormSave")}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  )
}
