import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: alternatesForPath("functies"),
};

export default function FunctiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
