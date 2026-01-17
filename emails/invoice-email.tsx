import {
  Button,
  Column,
  Heading,
  Hr,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  reference?: string;
  notes?: string;
  paymentUrl?: string; // Voor toekomstige betaallink integratie
}

export default function InvoiceEmail({
  customerName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  total,
  items: _items,
  companyName,
  companyEmail,
  companyPhone,
  reference,
  notes,
  paymentUrl,
}: InvoiceEmailProps) {
  // items is available for future use in email template
  void _items;
  return (
    <EmailLayout preview={`Factuur ${invoiceNumber} van ${companyName}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Factuur {invoiceNumber}
      </Heading>

      <Text className="text-gray-700 mb-6">
        Beste {customerName},
      </Text>

      <Text className="text-gray-700 mb-6">
        Hierbij ontvangt u factuur <strong>{invoiceNumber}</strong> voor de 
        door ons geleverde diensten/producten. De factuur staat als bijlage 
        bij deze e-mail.
      </Text>

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Factuurnummer</Text>
            <Text className="font-semibold text-gray-900">{invoiceNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Factuurdatum</Text>
            <Text className="font-semibold text-gray-900">{invoiceDate}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Vervaldatum</Text>
            <Text className="font-semibold text-gray-900">{dueDate}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Totaalbedrag</Text>
            <Text className="font-semibold text-xl text-gray-900">{total}</Text>
          </Column>
        </Row>
        {reference && (
          <Row className="mt-3">
            <Column>
              <Text className="text-sm text-gray-600 mb-1">Uw referentie</Text>
              <Text className="font-semibold text-gray-900">{reference}</Text>
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

      {paymentUrl && (
        <Section className="text-center my-8">
          <Button
            href={paymentUrl}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Betaal nu online
          </Button>
        </Section>
      )}

      <Text className="text-gray-700 mb-4">
        Graag ontvangen wij de betaling voor {dueDate}. U kunt het bedrag 
        overmaken naar het rekeningnummer dat op de factuur vermeld staat.
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
        Deze e-mail is automatisch gegenereerd. De bijgevoegde PDF-factuur 
        is het officiële document voor uw administratie.
      </Text>
    </EmailLayout>
  );
}
