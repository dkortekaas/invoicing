"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    // Only handle hash links on the homepage
    if (pathname !== "/") {
      return; // Let default navigation happen
    }

    e.preventDefault();
    const element = document.querySelector(hash);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
    >
      <div className="container-tight section-padding !py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl text-foreground">BetaalMe</span>
          </Link>

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
            <Link href="/prijzen" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Prijzen
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild> 
              <Link href="/login">
                Inloggen
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/register">
                Start gratis
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
