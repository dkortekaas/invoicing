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
import { type Locale, locales, localeNames, LOCALE_COOKIE } from "@/lib/i18n";
import { nlPathToEn, enPathToNl, isMarketingPath, localeFromPathname } from "@/lib/i18n-routes";

export function LanguageSwitcher() {
  const { locale } = useLocale();
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
      // For non-marketing pages: set cookie and refresh
      document.cookie = `${LOCALE_COOKIE}=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
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
