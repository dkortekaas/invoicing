import type { BlogPostFrontmatter } from "@/lib/blog";

export function generateJsonLd(frontmatter: BlogPostFrontmatter, url: string): object[] {
  const schemas: object[] = [];

  // Always generate a BlogPosting schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": frontmatter.title,
    "description": frontmatter.metaDescription ?? frontmatter.excerpt,
    "url": url,
    "datePublished": frontmatter.date,
    "dateModified": frontmatter.updatedAt ?? frontmatter.date,
    "publisher": {
      "@type": "Organization",
      "name": "Declair",
      "url": "https://declair.app",
    },
  });

  // HowTo schema when howToSteps are present
  if (frontmatter.howToSteps?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": frontmatter.title,
      "description": frontmatter.metaDescription ?? frontmatter.excerpt,
      "step": frontmatter.howToSteps.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "name": step.name,
        "text": step.text,
      })),
    });
  }

  // FAQPage schema when faq is present
  if (frontmatter.faq?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": frontmatter.faq.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer,
        },
      })),
    });
  }

  // ItemList schema when itemList is present
  if (frontmatter.itemList?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": frontmatter.title,
      "description": frontmatter.metaDescription ?? frontmatter.excerpt,
      "numberOfItems": frontmatter.itemList.length,
      "itemListElement": frontmatter.itemList.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item,
      })),
    });
  }

  return schemas;
}
