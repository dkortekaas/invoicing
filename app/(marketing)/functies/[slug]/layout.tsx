import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";
import { getLocaleFromHeaders } from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleFromHeaders();
  return {
    alternates: alternatesForPath(`functies/${slug}`, locale),
  };
}

export default function FunctieSlugLayout({ children }: Props) {
  return children;
}
