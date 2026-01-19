"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHashClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
      if (pathname !== "/") {
        return;
      }

      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
      setMobileMenuOpen(false);
    },
    [pathname]
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 animate-fade-up">
      <div className="container-tight section-padding !py-4">
        <nav className="flex items-center justify-between" aria-label="Hoofdnavigatie">
          <Link href="/" className="flex items-center gap-2" aria-label="BetaalMe - Naar homepage">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl text-foreground">BetaalMe</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#features"
              onClick={(e) => handleHashClick(e, "#features")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              onClick={(e) => handleHashClick(e, "#how-it-works")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Hoe het werkt
            </a>
            <Link
              href="/prijzen"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Prijzen
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/login">Inloggen</Link>
            </Button>
            <Button variant="default" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/register">Start gratis</Link>
            </Button>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Sluit menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden pt-4 pb-2 border-t border-border/50 mt-4"
            aria-label="Mobiele navigatie"
          >
            <ul className="space-y-2 list-none">
              <li>
                <a
                  href="/#features"
                  onClick={(e) => handleHashClick(e, "#features")}
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  onClick={(e) => handleHashClick(e, "#how-it-works")}
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  Hoe het werkt
                </a>
              </li>
              <li>
                <Link
                  href="/prijzen"
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Prijzen
                </Link>
              </li>
              <li className="pt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Inloggen
                  </Link>
                </Button>
                <Button variant="default" size="sm" className="w-full" asChild>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Start gratis
                  </Link>
                </Button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
