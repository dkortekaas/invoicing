import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: alternatesForPath("nieuwsbrief"),
};

export default function NieuwsbriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
