"use client";

import Link from "next/link";
import Logo from "@/components/marketing/logo";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { useTranslations } from "@/components/providers/locale-provider";

const Footer = () => {
  const { t, lp } = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { labelKey: "features" as const, href: lp("/functies") },
      { labelKey: "pricing" as const, href: lp("/prijzen") },
    ],
    resources: [
      { labelKey: "blog" as const, href: lp("/blog") },
      { labelKey: "helpCenter" as const, href: lp("/help") },
    ],
    company: [
      { labelKey: "contact" as const, href: lp("/contact") },
    ],
    legal: [
      { labelKey: "privacy" as const, href: "/privacy" },
      { labelKey: "terms" as const, href: "/algemene-voorwaarden" },
      { labelKey: "cookies" as const, href: "/cookie-beleid" },
    ],
  };

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto pt-12 pb-4 md:pt-16 md:pb-8">
        <div className="grid grid-cols-2 px-6 md:px-0 md:grid-cols-6 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              {t("tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("product")}</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`links.${link.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("resources")}</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`links.${link.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("company")}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`links.${link.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("legal")}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`links.${link.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-foreground mb-4">
              {t("newsletter.title")}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {t("newsletter.description")}
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Declair. {t("copyright")}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{t("shortcheeseSolutions")}</span>
            <span>{t("kvk")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
