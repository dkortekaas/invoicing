"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { MapPin, CheckCircle2, Clock, Sparkles } from "lucide-react";
import CallToActionSection from "@/components/marketing/cta-section";
import { useTranslations } from "@/components/providers/locale-provider";
import type { RoadmapData } from "@/lib/roadmap";

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "In ontwikkeling": Clock,
  "Gepland": MapPin,
  "Recent afgerond": CheckCircle2,
};
const defaultIcon = Sparkles;

function getSectionIcon(title: string) {
  return sectionIcons[title] ?? defaultIcon;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

interface RoadmapClientProps {
  roadmap: RoadmapData;
}

export function RoadmapClient({ roadmap }: RoadmapClientProps) {
  const { t, lp } = useTranslations("roadmap");
  const { title, description, sections } = roadmap;

  return (
    <main id="main-content">
      <section className="pt-28 md:pt-36 pb-16 md:pb-20 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {description}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-0">
          <div className="max-w-3xl mx-auto space-y-12">
            {sections.map((section) => {
              const Icon = getSectionIcon(section.title);
              return (
                <motion.div
                  key={section.title}
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {section.items.map((line, i) => (
                      <motion.li
                        key={i}
                        variants={item}
                        className="flex gap-3 text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        <span className="prose prose-sm prose-neutral dark:prose-invert max-w-none inline [&>strong]:text-foreground [&>p]:inline [&>p]:m-0">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <span>{children}</span>,
                              strong: ({ children }) => (
                                <strong className="font-medium text-foreground">
                                  {children}
                                </strong>
                              ),
                            }}
                          >
                            {line}
                          </ReactMarkdown>
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <CallToActionSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        linkHref1="/register"
        linkText1={t("ctaButton1")}
        linkHref2={lp("/prijzen")}
        linkText2={t("ctaButton2")}
        checkText1={t("ctaCheck1")}
        checkText2={t("ctaCheck2")}
        checkText3={t("ctaCheck3")}
      />
    </main>
  );
}
