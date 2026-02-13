import type { Metadata } from 'next';
import Header from '@/components/marketing/header';
import Footer from '@/components/marketing/footer';
import { SkipToContentLink } from '@/components/marketing/skip-to-content';
import { alternatesForPath, siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Declair - Factureren zonder gedoe | Facturatie voor ZZP\'ers',
    template: '%s | Declair',
  },
  description: 'De complete facturatie-app voor Nederlandse ZZP\'ers en freelancers. Maak facturen in seconden, ontvang sneller betaald met iDEAL en houd je administratie moeiteloos bij.',
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
  authors: [{ name: 'Declair' }],
  creator: 'Declair',
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
    siteName: 'Declair',
    title: 'Declair - Factureren zonder gedoe | Facturatie voor ZZP\'ers',
    description: 'De complete facturatie-app voor Nederlandse ZZP\'ers en freelancers. Maak facturen in seconden, ontvang sneller betaald met iDEAL en houd je administratie moeiteloos bij.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Declair - Facturatie Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Declair - Factureren zonder gedoe | Facturatie voor ZZP\'ers',
    description: 'De complete facturatie-app voor Nederlandse ZZP\'ers en freelancers. Maak facturen in seconden, ontvang sneller betaald met iDEAL en houd je administratie moeiteloos bij.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: alternatesForPath(''),
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
        name: 'Declair',
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
        name: 'Declair',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        inLanguage: 'nl-NL',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Declair',
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
      <SkipToContentLink />
      <Header />
        {children}
      <Footer />
    </div>
  );
}
