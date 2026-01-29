import type { ExpenseCategory } from '@prisma/client';

// Keywords mapped to expense categories
const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  TRAVEL: [
    'shell', 'bp', 'esso', 'total', 'tankstation', 'benzine', 'diesel',
    'ns', 'ov', 'trein', 'bus', 'tram', 'metro', 'translink', 'arriva',
    'taxi', 'uber', 'bolt', 'parking', 'parkeren', 'q-park',
    'schiphol', 'airport', 'vliegticket', 'klm', 'transavia',
    'hotel', 'booking', 'airbnb',
  ],
  SOFTWARE: [
    'adobe', 'microsoft', 'google', 'apple', 'amazon web services', 'aws',
    'github', 'gitlab', 'bitbucket', 'jetbrains', 'slack', 'zoom',
    'dropbox', 'notion', 'figma', 'canva', 'spotify', 'netflix',
    'saas', 'subscription', 'licentie', 'software', 'app store',
    'vercel', 'netlify', 'heroku', 'digitalocean',
  ],
  EQUIPMENT: [
    'mediamarkt', 'coolblue', 'bol.com', 'amazon',
    'apple store', 'computer', 'laptop', 'monitor', 'toetsenbord',
    'muis', 'printer', 'scanner', 'webcam', 'headset',
    'kabel', 'adapter', 'usb', 'ssd', 'harde schijf',
  ],
  OFFICE: [
    'staples', 'bruna', 'hema', 'action', 'kantoor',
    'papier', 'pen', 'inkt', 'toner', 'envelop', 'map',
    'bureau', 'stoel', 'lamp',
  ],
  TELECOM: [
    'vodafone', 'kpn', 't-mobile', 'tele2', 'ziggo', 'xs4all',
    'telefoon', 'internet', 'mobiel', 'simkaart', 'data',
  ],
  MARKETING: [
    'google ads', 'facebook', 'instagram', 'linkedin', 'twitter',
    'advertentie', 'marketing', 'reclame', 'flyer', 'visitekaartje',
    'drukwerk', 'banner', 'promotie',
  ],
  EDUCATION: [
    'cursus', 'training', 'opleiding', 'workshop', 'seminar',
    'conferentie', 'boek', 'ebook', 'udemy', 'coursera', 'linkedin learning',
  ],
  INSURANCE: [
    'verzekering', 'aov', 'beroepsaansprakelijkheid', 'rechtsbijstand',
    'aegon', 'nationale nederlanden', 'interpolis', 'centraal beheer',
  ],
  ACCOUNTANT: [
    'accountant', 'boekhouder', 'administratie', 'belasting',
    'moneybird', 'exact', 'e-boekhouden', 'twinfield',
  ],
  UTILITIES: [
    'eneco', 'vattenfall', 'essent', 'greenchoice',
    'energie', 'gas', 'elektra', 'water',
  ],
  RENT: [
    'huur', 'kantoorruimte', 'werkplek', 'seats2meet', 'spaces',
    'regus', 'wework',
  ],
  MAINTENANCE: [
    'onderhoud', 'reparatie', 'schoonmaak', 'service',
  ],
  PROFESSIONAL: [
    'advocaat', 'notaris', 'consultant', 'adviseur',
    'juridisch', 'advies',
  ],
  OTHER: [],
};

/**
 * Suggests an expense category based on the supplier name and description
 */
export function suggestCategory(
  supplier?: string,
  description?: string
): ExpenseCategory | undefined {
  const searchText = `${supplier || ''} ${description || ''}`.toLowerCase();

  if (!searchText.trim()) {
    return undefined;
  }

  // Check each category for matching keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category as ExpenseCategory;
      }
    }
  }

  return undefined;
}

/**
 * Returns the Dutch label for an expense category
 */
export function getCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    OFFICE: 'Kantoorkosten',
    TRAVEL: 'Reiskosten',
    EQUIPMENT: 'Apparatuur',
    SOFTWARE: 'Software/Subscriptions',
    MARKETING: 'Marketing',
    EDUCATION: 'Opleiding',
    INSURANCE: 'Verzekeringen',
    ACCOUNTANT: 'Accountant',
    TELECOM: 'Telefoon/Internet',
    UTILITIES: 'Energie',
    RENT: 'Huur',
    MAINTENANCE: 'Onderhoud',
    PROFESSIONAL: 'Professionele diensten',
    OTHER: 'Overig',
  };
  return labels[category];
}
