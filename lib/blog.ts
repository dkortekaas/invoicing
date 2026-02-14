import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface BlogPostFrontmatter {
  title: string;
  /** SEO title for meta tags (falls back to title) */
  seoTitle?: string;
  /** Meta description for SEO (falls back to excerpt) */
  metaDescription?: string;
  excerpt: string;
  /** Optional hero/cover image path under public/ (e.g. blog/post.PNG). Falls back to categoryEmoji when absent. */
  image?: string;
  date: string;
  /** Last modified date (falls back to date) */
  updatedAt?: string;
  category: string;
  readTime: number;
  author: string;
  authorRole: string;
  /** Canonical URL for SEO */
  canonical?: string;
  /** SEO keywords */
  keywords?: string[];
  /** Structured data: HowTo steps */
  howToSteps?: HowToStep[];
  /** Structured data: FAQ items */
  faq?: FaqItem[];
  /** Structured data: ItemList entries */
  itemList?: string[];
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
}

function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(getSlugFromFilename);
}

export function getPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => {
      const dateA = new Date(a.frontmatter.date).getTime();
      const dateB = new Date(b.frontmatter.date).getTime();
      return dateB - dateA;
    });
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = data as BlogPostFrontmatter;
  return {
    slug,
    frontmatter: {
      ...frontmatter,
      readTime: Number(frontmatter.readTime) || 5,
    },
    content,
  };
}
