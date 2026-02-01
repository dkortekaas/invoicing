import { getPosts } from "@/lib/blog";
import { BlogClient } from "@/components/marketing/blog-client";

export default function BlogPage() {
  const posts = getPosts();
  return <BlogClient posts={posts} />;
}
