'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const BlogPage = () => {
  const { t } = useTranslations("blog");

  // Blog posts data - in a real app this would come from a CMS or database
  const featuredPost = {
    slug: "btw-aangifte-tips-zzp",
    category: "belasting",
    date: "2026-01-15",
    readTime: 8,
  };

  const posts = [
    {
      slug: "factureren-beginners-gids",
      category: "tips",
      date: "2026-01-10",
      readTime: 6,
    },
    {
      slug: "bonnetjes-scannen-ocr",
      category: "productiviteit",
      date: "2026-01-05",
      readTime: 5,
    },
    {
      slug: "sneller-betaald-krijgen",
      category: "betalingen",
      date: "2025-12-28",
      readTime: 7,
    },
    {
      slug: "urenregistratie-freelancers",
      category: "productiviteit",
      date: "2025-12-20",
      readTime: 5,
    },
    {
      slug: "boekhouding-uitbesteden-of-zelf-doen",
      category: "tips",
      date: "2025-12-15",
      readTime: 10,
    },
    {
      slug: "kilometerregistratie-belastingvoordeel",
      category: "belasting",
      date: "2025-12-10",
      readTime: 6,
    },
  ];

  const categories = [
    { key: "all", count: posts.length + 1 },
    { key: "tips", count: 2 },
    { key: "belasting", count: 2 },
    { key: "productiviteit", count: 2 },
    { key: "betalingen", count: 1 },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-medium">{t("subtitle")}</span>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold text-foreground">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.key}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category.key === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {t(`categories.${category.key}`)} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group block rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-xl transition-all"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image placeholder */}
                <div className="aspect-[16/9] md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-6xl">📊</div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {t(`categories.${featuredPost.category}`)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredPost.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime} min
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {t(`posts.${featuredPost.slug}.title`)}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {t(`posts.${featuredPost.slug}.excerpt`)}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {t(`posts.${featuredPost.slug}.author`)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t(`posts.${featuredPost.slug}.authorRole`)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("latestArticles")}
            </h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {posts.map((post) => (
              <motion.article key={post.slug} variants={item}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block h-full rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  {/* Image placeholder */}
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <div className="text-4xl">
                      {post.category === "tips" && "💡"}
                      {post.category === "belasting" && "📋"}
                      {post.category === "productiviteit" && "⚡"}
                      {post.category === "betalingen" && "💳"}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-muted font-medium">
                        {t(`categories.${post.category}`)}
                      </span>
                      <span>{formatDate(post.date)}</span>
                      <span>{post.readTime} min</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {t(`posts.${post.slug}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {t(`posts.${post.slug}.excerpt`)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      {t("readMore")}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg" className="gap-2">
              {t("loadMore")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("newsletterTitle")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("newsletterDescription")}
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="lg">
                {t("subscribe")}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              {t("newsletterDisclaimer")}
            </p>
          </motion.div>
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

export default BlogPage;
