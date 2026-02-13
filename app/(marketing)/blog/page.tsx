import type { Metadata } from "next";
import { getPosts } from "@/lib/blog";
import { BlogClient } from "@/components/marketing/blog-client";
import { alternatesForPath } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://declair.app";

export const metadata: Metadata = {
  title: "Blog - Tips & Gidsen voor ZZP'ers",
  description:
    "Praktische tips, handleidingen en nieuws over facturatie, btw en administratie voor Nederlandse zzp'ers en freelancers.",
  alternates: alternatesForPath("blog"),
  openGraph: {
    type: "website",
    title: "Blog - Tips & Gidsen voor ZZP'ers",
    description:
      "Praktische tips, handleidingen en nieuws over facturatie, btw en administratie voor Nederlandse zzp'ers en freelancers.",
    url: `${siteUrl}/blog`,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Declair Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - Tips & Gidsen voor ZZP'ers",
    description:
      "Praktische tips, handleidingen en nieuws over facturatie, btw en administratie voor Nederlandse zzp'ers en freelancers.",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function BlogPage() {
  const posts = getPosts();
  return <BlogClient posts={posts} />;
}
