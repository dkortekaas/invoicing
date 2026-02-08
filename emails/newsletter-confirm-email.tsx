import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface NewsletterConfirmEmailProps {
  confirmUrl: string;
}

export default function NewsletterConfirmEmail({
  confirmUrl,
}: NewsletterConfirmEmailProps) {
  return (
    <EmailLayout preview="Bevestig je nieuwsbrief inschrijving - Declair">
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Bevestig je inschrijving
      </Heading>

      <Text className="text-gray-700 mb-6">
        Bedankt voor je interesse in de Declair nieuwsbrief! Klik op de
        onderstaande knop om je inschrijving te bevestigen.
      </Text>

      <Section className="text-center my-8">
        <Button
          href={confirmUrl}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Inschrijving bevestigen
        </Button>
      </Section>

      <Text className="text-gray-700 mb-4">
        Na bevestiging ontvang je periodiek tips over facturatie, belastingen en
        ondernemen als ZZP-er.
      </Text>

      <Text className="text-sm text-gray-500 mb-4">
        Heb je je niet ingeschreven? Dan kun je deze e-mail negeren.
      </Text>

      <Hr className="my-6" />

      <Text className="text-xs text-gray-500">
        Je kunt je op elk moment uitschrijven via de link in onze e-mails.
      </Text>
    </EmailLayout>
  );
}
