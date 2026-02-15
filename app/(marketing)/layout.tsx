import type { Metadata } from 'next';
import Header from '@/components/marketing/header';
import Footer from '@/components/marketing/footer';
import { SkipToContentLink } from '@/components/marketing/skip-to-content';
import { alternatesForPath, siteUrl } from '@/lib/seo';
import { getLocaleFromHeaders } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const isEn = locale === 'en';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: isEn
        ? 'Declair - Invoicing made easy | Invoicing for Freelancers'
        : 'Declair - Factureren zonder gedoe | Facturatie voor ZZP\'ers',
      template: '%s | Declair',
    },
    description: isEn
      ? 'The complete invoicing app for Dutch freelancers. Create invoices in seconds, get paid faster with iDEAL and keep your administration effortlessly organized.'
      : 'De complete facturatie-app voor Nederlandse ZZP\'ers en freelancers. Maak facturen in seconden, ontvang sneller betaald met iDEAL en houd je administratie moeiteloos bij.',
    keywords: isEn
      ? [
          'invoicing software',
          'invoice program',
          'freelancer invoicing',
          'online invoicing',
          'invoice creator',
          'VAT invoice',
          'send invoice',
          'payment reminder',
          'iDEAL payment link',
        ]
      : [
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
      locale: isEn ? 'en_US' : 'nl_NL',
      url: isEn ? `${siteUrl}/en` : siteUrl,
      siteName: 'Declair',
      title: isEn
        ? 'Declair - Invoicing made easy | Invoicing for Freelancers'
        : 'Declair - Factureren zonder gedoe | Facturatie voor ZZP\'ers',
      description: isEn
        ? 'The complete invoicing app for Dutch freelancers. Create invoices in seconds, get paid faster with iDEAL and keep your administration effortlessly organized.'
        : 'De complete facturatie-app voor Nederlandse ZZP\'ers en freelancers. Maak facturen in seconden, ontvang sneller betaald met iDEAL en houd je administratie moeiteloos bij.',
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Declair - Invoicing Software',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEn
        ? 'Declair - Invoicing made easy | Invoicing for Freelancers'
        : 'Declair - Factureren zonder gedoe | Facturatie voor ZZP\'ers',
      description: isEn
        ? 'The complete invoicing app for Dutch freelancers. Create invoices in seconds, get paid faster with iDEAL and keep your administration effortlessly organized.'
        : 'De complete facturatie-app voor Nederlandse ZZP\'ers en freelancers. Maak facturen in seconden, ontvang sneller betaald met iDEAL en houd je administratie moeiteloos bij.',
      images: [`${siteUrl}/og-image.png`],
    },
    alternates: alternatesForPath('', locale),
    category: 'business',
  };
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocaleFromHeaders();
  const isEn = locale === 'en';

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
        inLanguage: isEn ? 'en' : 'nl-NL',
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
          description: isEn ? 'Start invoicing for free' : 'Gratis starten met factureren',
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
