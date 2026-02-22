"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Share2,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";
import { MarkdownContent } from "@/components/marketing/blog-content";
import type { BlogPost } from "@/lib/blog";

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const { t, locale, lp } = useTranslations("blog");
  const blogBase = locale === "en" ? "/en/blog" : "/blog";
  const { frontmatter, content } = post;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const categoryEmoji = (category: string) => {
    if (category === "tips") return "💡";
    if (category === "belasting") return "📋";
    if (category === "productiviteit") return "⚡";
    if (category === "betalingen") return "💳";
    if (category === "onkosten") return "💸";
    if (category === "urenregistratie") return "⏰";
    if (category === "facturatie") return "📄";
    if (category === "vergelijkingen") return "🔍";
    return "📄";
  };

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="pt-28 md:pt-36 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <Link
              href={blogBase}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToBlog")}
            </Link>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {t(`categories.${frontmatter.category}`)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(frontmatter.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {frontmatter.readTime} min
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {frontmatter.title}
            </h1>

            <p className="mt-6 text-lg text-muted-foreground">
              {frontmatter.excerpt}
            </p>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {frontmatter.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {frontmatter.authorRole}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="aspect-[2/1] rounded-2xl bg-muted/50 flex items-center justify-center overflow-hidden relative mb-12">
              {frontmatter.image ? (
                <Image
                  src={`/${frontmatter.image}`}
                  alt={frontmatter.seoTitle ?? frontmatter.title}
                  fill
                  className="object-cover rounded-2xl"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
              ) : (
                <div className="text-8xl">
                  {categoryEmoji(frontmatter.category)}
                </div>
              )}
            </div>

            <MarkdownContent content={content} className="prose prose-lg max-w-none" />
          </motion.article>

          {/* Author box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-12 p-4 rounded-2xl bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {frontmatter.author}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {frontmatter.authorRole}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("relatedArticles")}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {relatedPosts.map((related, index) => (
              <motion.article
                key={related.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`${blogBase}/${related.slug}`}
                  className="group block h-full rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden relative">
                    {related.frontmatter.image ? (
                      <Image
                        src={`/${related.frontmatter.image}`}
                        alt={related.frontmatter.seoTitle ?? related.frontmatter.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="text-4xl">
                        {categoryEmoji(related.frontmatter.category)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {related.frontmatter.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {related.frontmatter.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      {t("readMore")}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CallToActionSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        linkHref1="/register"
        linkText1={t("ctaButton1")}
        linkHref2={lp("/functies")}
        linkText2={t("ctaButton2")}
      />
    </main>
  );
}
