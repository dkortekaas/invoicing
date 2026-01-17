import { Heading, Text, Section } from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface PaymentConfirmationEmailProps {
  customerName: string;
  invoiceNumber: string;
  total: string;
  paymentDate: string;
  companyName: string;
}

export default function PaymentConfirmationEmail({
  customerName,
  invoiceNumber,
  total,
  paymentDate,
  companyName,
}: PaymentConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Betalingsbevestiging factuur ${invoiceNumber}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Betaling ontvangen
      </Heading>

      <Text className="text-gray-700 mb-6">
        Beste {customerName},
      </Text>

      <Text className="text-gray-700 mb-6">
        Hartelijk dank voor uw betaling! Wij hebben de betaling voor factuur{' '}
        <strong>{invoiceNumber}</strong> in goede orde ontvangen.
      </Text>

      <Section className="bg-green-50 rounded-lg p-4 mb-6">
        <Text className="text-sm text-gray-600 mb-1">Factuurnummer</Text>
        <Text className="font-semibold text-gray-900 mb-3">{invoiceNumber}</Text>
        
        <Text className="text-sm text-gray-600 mb-1">Ontvangen bedrag</Text>
        <Text className="font-semibold text-xl text-gray-900 mb-3">{total}</Text>
        
        <Text className="text-sm text-gray-600 mb-1">Ontvangen op</Text>
        <Text className="font-semibold text-gray-900">{paymentDate}</Text>
      </Section>

      <Text className="text-gray-700 mb-6">
        Deze factuur is nu volledig voldaan. U hoeft geen verdere actie te ondernemen.
      </Text>

      <Text className="text-sm text-gray-600">
        Met vriendelijke groet,
        <br />
        <strong>{companyName}</strong>
      </Text>
    </EmailLayout>
  );
}
