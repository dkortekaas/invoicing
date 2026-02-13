import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: alternatesForPath("help"),
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
