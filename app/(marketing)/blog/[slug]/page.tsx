import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getPosts, getPostSlugs } from "@/lib/blog";
import { BlogPostClient } from "@/components/marketing/blog-post-client";
import { alternatesForPath } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://declair.app";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const { title, seoTitle, excerpt, metaDescription, image } = post.frontmatter;
  const metaTitle = seoTitle ?? title;
  const metaDesc = metaDescription ?? excerpt;
  const imageUrl = image ? `${siteUrl}/${image}` : `${siteUrl}/og-image.png`;
  return {
    title: metaTitle,
    description: metaDesc,
    alternates: alternatesForPath(`blog/${slug}`),
    openGraph: {
      type: "article",
      title: metaTitle,
      description: metaDesc,
      url: `${siteUrl}/blog/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  const { title, excerpt, image, date, author } = post.frontmatter;
  const articleUrl = `${siteUrl}/blog/${slug}`;
  const imageUrl = image ? `${siteUrl}/${image}` : `${siteUrl}/og-image.png`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    image: imageUrl,
    datePublished: date,
    dateModified: date,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Declair",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
