import type { Metadata } from 'next';
import Header from '@/components/marketing/header';
import Footer from '@/components/marketing/footer';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://betaalme.nl';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BetaalMe - Facturatie Software voor ZZP\'ers | Snel Betaald Worden',
    template: '%s | BetaalMe',
  },
  description: 'Professionele facturatiesoftware voor ZZP\'ers en kleine bedrijven. Maak facturen in 1 minuut, automatische betaalherinneringen, iDEAL-betaallink. Gratis starten.',
  keywords: [
    'facturatie software',
    'factuur programma',
    'zzp factureren',
    'online factureren',
    'facturatie zzp',
    'factuur maken',
    'boekhouding zzp',
    'btw factuur',
    'factuur versturen',
    'betaalherinnering',
    'ideal betaallink',
    'freelancer facturatie',
  ],
  authors: [{ name: 'BetaalMe' }],
  creator: 'BetaalMe',
  publisher: 'Shortcheese Solutions',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: siteUrl,
    siteName: 'BetaalMe',
    title: 'BetaalMe - Facturatie Software voor ZZP\'ers',
    description: 'Professionele facturatiesoftware voor ZZP\'ers. Maak facturen in 1 minuut, automatische betaalherinneringen, iDEAL-betaallink. Gratis starten.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BetaalMe - Facturatie Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BetaalMe - Facturatie Software voor ZZP\'ers',
    description: 'Professionele facturatiesoftware voor ZZP\'ers. Maak facturen in 1 minuut. Gratis starten.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'business',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'BetaalMe',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`,
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'BetaalMe',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        inLanguage: 'nl-NL',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'BetaalMe',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          description: 'Gratis starten met factureren',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '150',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Ga naar hoofdinhoud
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
