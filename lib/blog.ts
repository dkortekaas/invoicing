import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Locale } from "./i18n";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function blogDir(locale: Locale): string {
  return path.join(CONTENT_DIR, locale);
}

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
  /** Slug of the translated post in the other language */
  translationSlug?: string;
}

export interface BlogPost {
  slug: string;
  locale: Locale;
  frontmatter: BlogPostFrontmatter;
  content: string;
}

function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

export function getPostSlugs(locale: Locale = "nl"): string[] {
  const dir = blogDir(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map(getSlugFromFilename);
}

export function getPosts(locale: Locale = "nl"): BlogPost[] {
  const slugs = getPostSlugs(locale);
  const posts = slugs
    .map((slug) => getPostBySlug(slug, locale))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => {
      const dateA = new Date(a.frontmatter.date).getTime();
      const dateB = new Date(b.frontmatter.date).getTime();
      return dateB - dateA;
    });
  return posts;
}

export function getPostBySlug(slug: string, locale: Locale = "nl"): BlogPost | null {
  const filePath = path.join(blogDir(locale), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = data as BlogPostFrontmatter;
  return {
    slug,
    locale,
    frontmatter: {
      ...frontmatter,
      readTime: Number(frontmatter.readTime) || 5,
    },
    content,
  };
}

/**
 * Try to find a post by slug, checking the given locale first, then the other.
 * Returns the post and the locale it was found in.
 */
export function findPostBySlug(slug: string, preferredLocale: Locale = "nl"): BlogPost | null {
  const post = getPostBySlug(slug, preferredLocale);
  if (post) return post;
  // Fallback: check the other locale
  const otherLocale: Locale = preferredLocale === "nl" ? "en" : "nl";
  return getPostBySlug(slug, otherLocale);
}
