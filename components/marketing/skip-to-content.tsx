"use client";

import { useTranslations } from "@/components/providers/locale-provider";

export function SkipToContentLink() {
  const { t } = useTranslations("common");
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      {t("skipToContent")}
    </a>
  );
}
