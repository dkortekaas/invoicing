"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "@/components/providers/locale-provider";

const featureKeys = [
  { key: "invoices", href: "/functies/facturen-en-offertes" },
  { key: "payments", href: "/functies/betalingen" },
  { key: "expenses", href: "/functies/onkosten-en-bonnetjes" },
  { key: "projects", href: "/functies/projecten-en-uren" },
  { key: "reports", href: "/functies/rapportages-en-belasting" },
  //{ key: "integrations", href: "/functies/koppelingen" },
] as const;

const Header = () => {
  const { t } = useTranslations("header");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = featureKeys.map(({ key, href }) => ({
    title: t(`featuresList.${key}.title`),
    description: t(`featuresList.${key}.description`),
    href,
  }));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto relative">
        <div className="flex items-center h-16 px-6 md:px-0 md:h-[72px]">
          {/* Left: Logo */}
          <Link href="/" className="flex-1 flex items-center min-w-0">
            <Logo asLink={false} />
          </Link>

          {/* Center: Desktop Navigation (exact middle) */}
          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50">
                    {t("features")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[500px] gap-1 p-4 md:grid-cols-2">
                      {features.map((feature) => (
                        <li key={feature.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={feature.href}
                              className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent focus:bg-accent"
                            >
                              <div className="text-sm font-medium leading-none text-foreground">
                                {feature.title}
                              </div>
                              <p className="line-clamp-1 text-sm leading-snug text-muted-foreground mt-1">
                                {feature.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <Link
              href="/prijzen"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {t("pricing")}
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {t("blog")}
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {t("contact")}
            </Link>
          </nav>

          {/* Right: Desktop Actions + Mobile Menu Button */}
          <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t("startFree")}</Button>
              </Link>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -mr-2"
              aria-label={t("toggleMenu")}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container px-4 md:px-0 py-4 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                  {t("features")}
                </p>
                {features.map((feature) => (
                  <Link
                    key={feature.href}
                    href={feature.href}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {feature.title}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-1">
                <Link
                  href="/prijzen"
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("pricing")}
                </Link>
                <Link
                  href="/blog"
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("blog")}
                </Link>
                <Link
                  href="/contact"
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("contact")}
                </Link>
              </div>
              <div className="border-t border-border pt-4 flex flex-wrap items-center gap-2">
                <LanguageSwitcher />
                <Link href="/login" className="flex-1 min-w-0" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t("login")}
                  </Button>
                </Link>
                <Link href="/register" className="flex-1 min-w-0" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">{t("startFree")}</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
