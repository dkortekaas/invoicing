'use client';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Send,
  CheckCircle,
  HelpCircle,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";

const ContactPage = () => {
  const { t } = useTranslations("contact");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to an API
    setFormSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      titleKey: "emailTitle",
      descriptionKey: "emailDescription",
      value: "support@declair.nl",
      href: "mailto:support@declair.nl",
    },
    {
      icon: MessageSquare,
      titleKey: "chatTitle",
      descriptionKey: "chatDescription",
      value: t("chatValue"),
      href: "#",
    },
    {
      icon: Clock,
      titleKey: "hoursTitle",
      descriptionKey: "hoursDescription",
      value: t("hoursValue"),
      href: null,
    },
  ];

  const faqItems = [
    { questionKey: "faq1Question", answerKey: "faq1Answer", href: "/help" },
    { questionKey: "faq2Question", answerKey: "faq2Answer", href: "/prijzen" },
    { questionKey: "faq3Question", answerKey: "faq3Answer", href: "/help" },
  ];

  const subjects = [
    { value: "general", labelKey: "subjectGeneral" },
    { value: "sales", labelKey: "subjectSales" },
    { value: "support", labelKey: "subjectSupport" },
    { value: "billing", labelKey: "subjectBilling" },
    { value: "partnership", labelKey: "subjectPartnership" },
    { value: "press", labelKey: "subjectPress" },
  ];

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

      {/* Contact Methods */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {t(method.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t(method.descriptionKey)}
                </p>
                {method.href ? (
                  <a
                    href={method.href}
                    className="text-primary font-medium hover:underline"
                  >
                    {method.value}
                  </a>
                ) : (
                  <span className="text-foreground font-medium">{method.value}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-card rounded-2xl border border-border p-8 md:p-10">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t("formTitle")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t("formDescription")}
                </p>

                {formSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t("successTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("successDescription")}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          {t("labelName")} *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t("placeholderName")}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          {t("labelEmail")} *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t("placeholderEmail")}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="company"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          {t("labelCompany")}
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t("placeholderCompany")}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          {t("labelSubject")} *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">{t("placeholderSubject")}</option>
                          {subjects.map((subject) => (
                            <option key={subject.value} value={subject.value}>
                              {t(subject.labelKey)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        {t("labelMessage")} *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder={t("placeholderMessage")}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2">
                      {t("submitButton")}
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Side Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Quick Links */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  {t("quickLinksTitle")}
                </h3>
                <div className="space-y-4">
                  <Link
                    href="/help"
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {t("quickLink1Title")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("quickLink1Description")}
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/functies"
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {t("quickLink2Title")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("quickLink2Description")}
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/prijzen"
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {t("quickLink3Title")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("quickLink3Description")}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  {t("faqTitle")}
                </h3>
                <div className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                      <h4 className="font-medium text-foreground mb-1">
                        {t(faq.questionKey)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t(faq.answerKey)}
                      </p>
                    </div>
                  ))}
                </div>
                <Link href="/help" className="block mt-6">
                  <Button variant="outline" className="w-full">
                    {t("viewAllFaq")}
                  </Button>
                </Link>
              </div>

              {/* Company Info */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  {t("companyInfoTitle")}
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Shortcheese Solutions</div>
                      <div className="text-muted-foreground">
                        Nederland
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <a href="mailto:info@declair.nl" className="text-primary hover:underline">
                      info@declair.nl
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">KvK: 30220287</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
