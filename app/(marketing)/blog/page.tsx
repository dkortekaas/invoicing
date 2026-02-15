import type { Metadata } from "next";
import { getPosts } from "@/lib/blog";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { BlogClient } from "@/components/marketing/blog-client";
import { alternatesForPath } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://declair.app";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const isEn = locale === "en";

  return {
    title: isEn ? "Blog - Tips & Guides for Freelancers" : "Blog - Tips & Gidsen voor ZZP'ers",
    description: isEn
      ? "Practical tips, guides and news about invoicing, VAT and administration for freelancers."
      : "Praktische tips, handleidingen en nieuws over facturatie, btw en administratie voor Nederlandse zzp'ers en freelancers.",
    alternates: alternatesForPath("blog", locale),
    openGraph: {
      type: "website",
      title: isEn ? "Blog - Tips & Guides for Freelancers" : "Blog - Tips & Gidsen voor ZZP'ers",
      description: isEn
        ? "Practical tips, guides and news about invoicing, VAT and administration for freelancers."
        : "Praktische tips, handleidingen en nieuws over facturatie, btw en administratie voor Nederlandse zzp'ers en freelancers.",
      url: isEn ? `${siteUrl}/en/blog` : `${siteUrl}/blog`,
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
      title: isEn ? "Blog - Tips & Guides for Freelancers" : "Blog - Tips & Gidsen voor ZZP'ers",
      description: isEn
        ? "Practical tips, guides and news about invoicing, VAT and administration for freelancers."
        : "Praktische tips, handleidingen en nieuws over facturatie, btw en administratie voor Nederlandse zzp'ers en freelancers.",
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function BlogPage() {
  const locale = await getLocaleFromHeaders();
  const posts = getPosts(locale);
  return <BlogClient posts={posts} />;
}
