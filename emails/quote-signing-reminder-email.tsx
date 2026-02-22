import {
  Button,
  Column,
  Heading,
  Hr,
  Row,
  Section,
  Text,
} from "@react-email/components"
import { EmailLayout } from "./components/email-layout"

interface QuoteSigningReminderEmailProps {
  customerName: string
  quoteNumber: string
  total: string
  expiryDate: string
  daysUntilExpiry: number
  companyName: string
  companyEmail: string
  companyPhone?: string
  signingUrl: string
}

export default function QuoteSigningReminderEmail({
  customerName,
  quoteNumber,
  total,
  expiryDate,
  daysUntilExpiry,
  companyName,
  companyEmail,
  companyPhone,
  signingUrl,
}: QuoteSigningReminderEmailProps) {
  const urgency = daysUntilExpiry <= 1 ? "vandaag" : `nog ${daysUntilExpiry} dag${daysUntilExpiry !== 1 ? "en" : ""}`

  return (
    <EmailLayout preview={`Herinnering: offerte ${quoteNumber} verloopt ${urgency}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Herinnering: offerte {quoteNumber}
      </Heading>

      <Text className="text-gray-700 mb-6">Beste {customerName},</Text>

      <Text className="text-gray-700 mb-6">
        Wij willen u er vriendelijk aan herinneren dat offerte{" "}
        <strong>{quoteNumber}</strong> nog wacht op uw ondertekening. De offerte is
        geldig tot <strong>{expiryDate}</strong> ({urgency}).
      </Text>

      <Section className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-amber-800 mb-1">Offertenummer</Text>
            <Text className="font-semibold text-amber-900">{quoteNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-amber-800 mb-1">Totaalbedrag</Text>
            <Text className="font-semibold text-xl text-amber-900">{total}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-amber-800 mb-1">Geldig tot</Text>
            <Text className="font-semibold text-amber-900">{expiryDate}</Text>
          </Column>
        </Row>
      </Section>

      <Section className="text-center my-8">
        <Button
          href={signingUrl}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-base"
        >
          Bekijk en onderteken nu
        </Button>
      </Section>

      <Text className="text-sm text-gray-600 mb-4">
        Als u vragen heeft of de offerte wilt bespreken, aarzel dan niet om contact
        met ons op te nemen.
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
        U ontvangt deze herinnering omdat er nog een openstaand ondertekeningsverzoek
        is voor uw account. Als u al heeft ondertekend, kunt u deze e-mail negeren.
      </Text>
    </EmailLayout>
  )
}
