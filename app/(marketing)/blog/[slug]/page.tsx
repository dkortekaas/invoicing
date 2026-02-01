'use client';

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Share2, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";

const blogPosts = [
  "btw-aangifte-tips-zzp",
  "factureren-beginners-gids",
  "bonnetjes-scannen-ocr",
  "sneller-betaald-krijgen",
  "urenregistratie-freelancers",
  "boekhouding-uitbesteden-of-zelf-doen",
  "kilometerregistratie-belastingvoordeel",
];

const BlogPostPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const { t } = useTranslations("blog");

  if (!blogPosts.includes(slug)) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get related posts (exclude current)
  const relatedPosts = blogPosts.filter((p) => p !== slug).slice(0, 3);

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToBlog")}
            </Link>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {t(`posts.${slug}.category`)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(t(`posts.${slug}.date`))}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {t(`posts.${slug}.readTime`)} min
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {t(`posts.${slug}.title`)}
            </h1>

            <p className="mt-6 text-lg text-muted-foreground">
              {t(`posts.${slug}.excerpt`)}
            </p>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {t(`posts.${slug}.author`)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t(`posts.${slug}.authorRole`)}
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
            className="max-w-3xl mx-auto prose prose-lg dark:prose-invert"
          >
            {/* Article image placeholder */}
            <div className="aspect-[2/1] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-12 not-prose">
              <div className="text-8xl">📊</div>
            </div>

            {/* Article content - this would normally come from a CMS */}
            <div className="space-y-6 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                {t(`posts.${slug}.content.intro`)}
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
                {t(`posts.${slug}.content.heading1`)}
              </h2>
              <p>
                {t(`posts.${slug}.content.paragraph1`)}
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
                {t(`posts.${slug}.content.heading2`)}
              </h2>
              <p>
                {t(`posts.${slug}.content.paragraph2`)}
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-8 not-prose">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t(`posts.${slug}.content.tipTitle`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`posts.${slug}.content.tipContent`)}
                </p>
              </div>

              <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
                {t(`posts.${slug}.content.heading3`)}
              </h2>
              <p>
                {t(`posts.${slug}.content.paragraph3`)}
              </p>

              <p>
                {t(`posts.${slug}.content.conclusion`)}
              </p>
            </div>
          </motion.article>

          {/* Author box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-12 p-8 rounded-2xl bg-muted/50 border border-border"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t(`posts.${slug}.author`)}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t(`posts.${slug}.authorRole`)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("authorBio")}
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
            {relatedPosts.map((postSlug, index) => (
              <motion.article
                key={postSlug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/blog/${postSlug}`}
                  className="group block h-full rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <div className="text-4xl">📄</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {t(`posts.${postSlug}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {t(`posts.${postSlug}.excerpt`)}
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
        linkHref2="/functies"
        linkText2={t("ctaButton2")}
      />
    </main>
  );
};

export default BlogPostPage;
