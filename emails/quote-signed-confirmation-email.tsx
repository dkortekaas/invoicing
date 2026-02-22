import {
  Column,
  Heading,
  Hr,
  Row,
  Section,
  Text,
} from "@react-email/components"
import { EmailLayout } from "./components/email-layout"

interface QuoteSignedConfirmationEmailProps {
  customerName: string
  signerName: string
  quoteNumber: string
  quoteDate: string
  total: string
  signedAt: string
  companyName: string
  companyEmail: string
  companyPhone?: string
  remarks?: string
}

export default function QuoteSignedConfirmationEmail({
  customerName,
  signerName,
  quoteNumber,
  quoteDate,
  total,
  signedAt,
  companyName,
  companyEmail,
  companyPhone,
  remarks,
}: QuoteSignedConfirmationEmailProps) {
  return (
    <EmailLayout
      preview={`Bevestiging ondertekening offerte ${quoteNumber} — ${companyName}`}
    >
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Bevestiging van ondertekening
      </Heading>

      <Text className="text-gray-700 mb-6">Beste {customerName},</Text>

      <Text className="text-gray-700 mb-6">
        Hartelijk dank voor het ondertekenen van offerte <strong>{quoteNumber}</strong>.
        Uw handtekening is succesvol ontvangen en vastgelegd. In de bijlage vindt u
        de ondertekende offerte als PDF ter bewaring.
      </Text>

      <Section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-green-800 mb-1">Offertenummer</Text>
            <Text className="font-semibold text-green-900">{quoteNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-green-800 mb-1">Offertedatum</Text>
            <Text className="font-semibold text-green-900">{quoteDate}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-green-800 mb-1">Totaalbedrag</Text>
            <Text className="font-semibold text-xl text-green-900">{total}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-green-800 mb-1">Ondertekend door</Text>
            <Text className="font-semibold text-green-900">{signerName}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-green-800 mb-1">Ondertekend op</Text>
            <Text className="font-semibold text-green-900">{signedAt}</Text>
          </Column>
        </Row>
      </Section>

      {remarks && (
        <Text className="text-gray-700 mb-6">
          <strong>Uw opmerkingen:</strong> {remarks}
        </Text>
      )}

      <Text className="text-gray-700 mb-4">
        Wij gaan nu aan de slag op basis van de overeengekomen offerte. Mocht u
        vragen hebben, neem dan gerust contact met ons op.
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
        De ondertekende offerte is als PDF bijgevoegd bij deze e-mail en dient als
        officieel bewijs van de overeenkomst.
      </Text>
    </EmailLayout>
  )
}
