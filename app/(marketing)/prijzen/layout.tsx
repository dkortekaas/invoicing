import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: alternatesForPath("prijzen"),
};

export default function PrijzenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
