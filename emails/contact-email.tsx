import {
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/email-layout';

export interface ContactEmailProps {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export default function ContactEmail({
  name,
  email,
  company,
  subject,
  message,
}: ContactEmailProps) {
  return (
    <EmailLayout preview={`Contactformulier: ${subject} van ${name}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Nieuw bericht via contactformulier
      </Heading>

      <Section className="mb-4">
        <Text className="text-sm text-gray-500 mb-1">Van</Text>
        <Text className="text-gray-900 font-medium">{name}</Text>
        <Text className="text-gray-700">{email}</Text>
      </Section>

      {company ? (
        <Section className="mb-4">
          <Text className="text-sm text-gray-500 mb-1">Bedrijf</Text>
          <Text className="text-gray-900">{company}</Text>
        </Section>
      ) : null}

      <Section className="mb-4">
        <Text className="text-sm text-gray-500 mb-1">Onderwerp</Text>
        <Text className="text-gray-900">{subject}</Text>
      </Section>

      <Hr className="border-gray-200 my-6" />

      <Section>
        <Text className="text-sm text-gray-500 mb-1">Bericht</Text>
        <Text className="text-gray-900 whitespace-pre-wrap">{message}</Text>
      </Section>
    </EmailLayout>
  );
}
