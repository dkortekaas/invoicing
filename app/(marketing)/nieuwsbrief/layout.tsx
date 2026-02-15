import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";
import { getLocaleFromHeaders } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  return {
    alternates: alternatesForPath("nieuwsbrief", locale),
  };
}

export default function NieuwsbriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
