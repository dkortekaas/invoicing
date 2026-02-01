import { notFound } from "next/navigation";
import { getPostBySlug, getPosts, getPostSlugs } from "@/lib/blog";
import { BlogPostClient } from "@/components/marketing/blog-post-client";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const { title, seoTitle, excerpt, metaDescription } = post.frontmatter;
  return {
    title: seoTitle ?? title,
    description: metaDescription ?? excerpt,
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

  return <BlogPostClient post={post} relatedPosts={relatedPosts} />;
}
