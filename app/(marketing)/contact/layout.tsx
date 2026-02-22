import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";
import { getLocaleFromHeaders } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  return {
    alternates: alternatesForPath("contact", locale),
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
