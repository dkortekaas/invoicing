"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./logo";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const features = [
  { title: "Facturen & Offertes", href: "/features/invoices", description: "Professionele documenten in seconden" },
  { title: "Betalingen", href: "/features/payments", description: "Sneller betaald met iDEAL" },
  { title: "Onkosten & Bonnetjes", href: "/features/expenses", description: "Scan en categoriseer automatisch" },
  { title: "Projecten & Uren", href: "/features/projects", description: "Urenregistratie en facturatie" },
  { title: "Rapportages & Belasting", href: "/features/reports", description: "BTW en belastingoverzichten" },
  { title: "Koppelingen", href: "/features/integrations", description: "Sync met je boekhouder" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50">
                    Features
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[500px] gap-1 p-4 md:grid-cols-2">
                      {features.map((feature) => (
                        <li key={feature.title}>
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
              Prijzen
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/help"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Help
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Inloggen
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start gratis</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -mr-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
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
            <div className="container py-4 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Features
                </p>
                {features.map((feature) => (
                  <Link
                    key={feature.title}
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
                  Prijzen
                </Link>
                <Link
                  href="/blog"
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/help"
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Help
                </Link>
              </div>
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Inloggen
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Start gratis</Button>
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