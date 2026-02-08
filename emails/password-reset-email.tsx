import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresInMinutes: number;
}

export default function PasswordResetEmail({
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Wachtwoord herstellen - Declair">
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Wachtwoord herstellen
      </Heading>

      <Text className="text-gray-700 mb-6">
        We hebben een verzoek ontvangen om het wachtwoord van je Declair-account
        te herstellen. Klik op de onderstaande knop om een nieuw wachtwoord in te
        stellen.
      </Text>

      <Section className="text-center my-8">
        <Button
          href={resetUrl}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Nieuw wachtwoord instellen
        </Button>
      </Section>

      <Text className="text-gray-700 mb-4">
        Deze link is {expiresInMinutes} minuten geldig. Als je geen
        wachtwoordherstel hebt aangevraagd, kun je deze e-mail negeren.
      </Text>

      <Text className="text-sm text-gray-500 mb-4">
        Werkt de knop niet? Kopieer en plak de volgende link in je browser:
        <br />
        {resetUrl}
      </Text>

      <Hr className="my-6" />

      <Text className="text-xs text-gray-500">
        Deze e-mail is automatisch verstuurd door Declair. Deel deze link met
        niemand.
      </Text>
    </EmailLayout>
  );
}
