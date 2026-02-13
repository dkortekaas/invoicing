import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    alternates: alternatesForPath(`functies/${slug}`),
  };
}

export default function FunctieSlugLayout({ children }: Props) {
  return children;
}
