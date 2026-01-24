import {
  Column,
  Heading,
  Hr,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface CreditNoteEmailProps {
  customerName: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  total: string;
  reason: string;
  reasonDescription?: string;
  originalInvoiceNumber?: string;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  notes?: string;
}

export default function CreditNoteEmail({
  customerName,
  creditNoteNumber,
  creditNoteDate,
  total,
  reason,
  reasonDescription,
  originalInvoiceNumber,
  items: _items,
  companyName,
  companyEmail,
  companyPhone,
  notes,
}: CreditNoteEmailProps) {
  // items is available for future use in email template
  void _items;
  return (
    <EmailLayout preview={`Credit Nota ${creditNoteNumber} van ${companyName}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Credit Nota {creditNoteNumber}
      </Heading>

      <Text className="text-gray-700 mb-6">
        Beste {customerName},
      </Text>

      <Text className="text-gray-700 mb-6">
        Hierbij ontvangt u credit nota <strong>{creditNoteNumber}</strong>.
        De credit nota staat als bijlage bij deze e-mail.
      </Text>

      <Section className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-600">
        <Row>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Credit nota nummer</Text>
            <Text className="font-semibold text-gray-900">{creditNoteNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Datum</Text>
            <Text className="font-semibold text-gray-900">{creditNoteDate}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Reden</Text>
            <Text className="font-semibold text-red-600">{reason}</Text>
            {reasonDescription && (
              <Text className="text-sm text-gray-600 mt-1">{reasonDescription}</Text>
            )}
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Credit bedrag</Text>
            <Text className="font-semibold text-xl text-red-600">-{total}</Text>
          </Column>
        </Row>
        {originalInvoiceNumber && (
          <Row className="mt-3">
            <Column>
              <Text className="text-sm text-gray-600 mb-1">Originele factuur</Text>
              <Text className="font-semibold text-gray-900">{originalInvoiceNumber}</Text>
            </Column>
          </Row>
        )}
      </Section>

      {notes && (
        <>
          <Text className="text-gray-700 mb-4">
            <strong>Opmerking:</strong> {notes}
          </Text>
        </>
      )}

      <Text className="text-gray-700 mb-4">
        Het gecrediteerde bedrag zal worden verrekend met toekomstige facturen
        of worden teruggestort, afhankelijk van de afspraken die wij met u hebben gemaakt.
      </Text>

      <Text className="text-gray-700 mb-4">
        Heeft u vragen over deze credit nota? Neem dan gerust contact met ons op.
      </Text>

      <Hr className="my-6" />

      <Text className="text-sm text-gray-600">
        Met vriendelijke groet,
        <br />
        <strong>{companyName}</strong>
        {companyPhone && (
          <>
            <br />
            Tel: {companyPhone}
          </>
        )}
        <br />
        E-mail: {companyEmail}
      </Text>

      <Hr className="my-6" />

      <Text className="text-xs text-gray-500">
        Deze e-mail is automatisch gegenereerd. De bijgevoegde PDF-credit nota
        is het officiële document voor uw administratie.
      </Text>
    </EmailLayout>
  );
}
