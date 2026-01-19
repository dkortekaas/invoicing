import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80" role="contentinfo">
      <div className="container-tight section-padding !py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="BetaalMe - Naar homepage">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl text-background">BetaalMe</span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              Factureren zonder gedoe voor zzp&apos;ers en eenmanszaken. Gemaakt om betaald te worden.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product links">
            <h2 className="font-semibold text-background mb-4">Product</h2>
            <ul className="space-y-2 list-none">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/prijzen"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Prijzen
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Hoe het werkt
                </Link>
              </li>
            </ul>
          </nav>

          {/* Bedrijf */}
          <nav aria-label="Bedrijf links">
            <h2 className="font-semibold text-background mb-4">Bedrijf</h2>
            <ul className="space-y-2 list-none">
              <li>
                <Link
                  href="/over-ons"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Over ons
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Juridische links">
            <h2 className="font-semibold text-background mb-4">Juridisch</h2>
            <ul className="space-y-2 list-none">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/voorwaarden"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Algemene voorwaarden
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} BetaalMe.nl. Alle rechten voorbehouden.
          </p>
          <p className="text-sm text-background/50">
            Shortcheese Solutions
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
