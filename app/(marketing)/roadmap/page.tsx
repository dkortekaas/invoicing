import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmap";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { RoadmapClient } from "@/components/marketing/roadmap-client";
import { alternatesForPath } from "@/lib/seo";
import { notFound } from "next/navigation";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://declair.app";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const isEn = locale === "en";
  const roadmap = getRoadmap();
  const description =
    roadmap?.description ??
    (isEn
      ? "See which features we are building and what is planned for Declair."
      : "Bekijk welke functionaliteiten we bouwen en wat er op de planning staat voor Declair.");

  return {
    title: isEn ? "Roadmap - What's coming next" : "Roadmap - Wat komt er aan",
    description,
    alternates: alternatesForPath("roadmap", locale),
    openGraph: {
      type: "website",
      title: isEn ? "Roadmap | Declair" : "Roadmap | Declair",
      description,
      url: isEn ? `${siteUrl}/en/roadmap` : `${siteUrl}/roadmap`,
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Declair Roadmap",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isEn ? "Roadmap | Declair" : "Roadmap | Declair",
      description,
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function RoadmapPage() {
  const roadmap = getRoadmap();
  if (!roadmap) notFound();

  return <RoadmapClient roadmap={roadmap} />;
}
