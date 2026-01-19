"use client";

import { usePathname } from "next/navigation";

const Footer = () => {
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
    <footer className="bg-foreground text-background/80">
      <div className="container-tight section-padding !py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl text-background">BetaalMe</span>
            </a>
            <p className="text-sm text-background/60 leading-relaxed">
              Factureren zonder gedoe voor zzp'ers en eenmanszaken. Gemaakt om betaald te worden.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleHashClick(e, "#features")}
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleHashClick(e, "#pricing")}
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Prijzen
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleHashClick(e, "#how-it-works")}
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Hoe het werkt
                </a>
              </li>
            </ul>
          </div>

          {/* Bedrijf */}
          <div>
            <h4 className="font-semibold text-background mb-4">Bedrijf</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-background/60 hover:text-background transition-colors">Over ons</a></li>
              <li><a href="#" className="text-sm text-background/60 hover:text-background transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-background/60 hover:text-background transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-background mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-background/60 hover:text-background transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-background/60 hover:text-background transition-colors">Voorwaarden</a></li>
              <li><a href="#" className="text-sm text-background/60 hover:text-background transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} BetaalMe.nl. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-background/50">Shortcheese Solutions</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
