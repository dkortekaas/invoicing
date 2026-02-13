import type { Metadata } from "next";
import { alternatesForPath } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: alternatesForPath("contact"),
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
