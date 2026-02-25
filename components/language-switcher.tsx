"use client";

import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "@/components/providers/locale-provider";
import { type Locale, locales, localeNames } from "@/lib/i18n";
import { nlPathToEn, enPathToNl, isMarketingPath, localeFromPathname } from "@/lib/i18n-routes";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  function handleLocaleChange(newLocale: string) {
    const targetLocale = newLocale as Locale;
    if (targetLocale === locale) return;

    if (isMarketingPath(pathname)) {
      const currentLocale = localeFromPathname(pathname);
      let targetPath: string;

      if (currentLocale === "nl" && targetLocale === "en") {
        targetPath = nlPathToEn(pathname);
      } else if (currentLocale === "en" && targetLocale === "nl") {
        targetPath = enPathToNl(pathname);
      } else {
        targetPath = pathname;
      }

      router.push(targetPath);
    } else {
      // Use setLocale from context: updates React state (instant re-render) + cookie + router.refresh()
      setLocale(targetLocale);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label={t("language")}>
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
          {locales.map((loc) => (
            <DropdownMenuRadioItem key={loc} value={loc}>
              {localeNames[loc]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
