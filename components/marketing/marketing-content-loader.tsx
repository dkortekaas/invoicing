"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/components/providers/locale-provider";

const MarketingContent = dynamic(
  () => import("./marketing-content").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center" aria-hidden="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);

export default function MarketingContentLoader() {
  const { locale } = useLocale();
  // Key forces remount when locale changes so dynamic content picks up new translations
  return <MarketingContent key={locale} />;
}
