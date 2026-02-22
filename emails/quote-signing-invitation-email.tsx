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

interface QuoteSigningInvitationEmailProps {
  customerName: string
  quoteNumber: string
  quoteDate: string
  expiryDate?: string
  total: string
  companyName: string
  companyEmail: string
  companyPhone?: string
  signingUrl: string
  notes?: string
  personalMessage?: string
}

export default function QuoteSigningInvitationEmail({
  customerName,
  quoteNumber,
  quoteDate,
  expiryDate,
  total,
  companyName,
  companyEmail,
  companyPhone,
  signingUrl,
  notes,
  personalMessage,
}: QuoteSigningInvitationEmailProps) {
  return (
    <EmailLayout preview={`Offerte ${quoteNumber} ter ondertekening van ${companyName}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Offerte ter ondertekening
      </Heading>

      <Text className="text-gray-700 mb-6">Beste {customerName},</Text>

      {personalMessage ? (
        <Text className="text-gray-700 mb-6">{personalMessage}</Text>
      ) : (
        <Text className="text-gray-700 mb-6">
          Hierbij ontvangt u offerte <strong>{quoteNumber}</strong> voor uw beoordeling
          en ondertekening. Via de knop hieronder kunt u de offerte bekijken en
          digitaal ondertekenen.
        </Text>
      )}

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Offertenummer</Text>
            <Text className="font-semibold text-gray-900">{quoteNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Offertedatum</Text>
            <Text className="font-semibold text-gray-900">{quoteDate}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Totaalbedrag</Text>
            <Text className="font-semibold text-xl text-gray-900">{total}</Text>
          </Column>
          {expiryDate && (
            <Column>
              <Text className="text-sm text-gray-600 mb-1">Geldig tot</Text>
              <Text className="font-semibold text-gray-900">{expiryDate}</Text>
            </Column>
          )}
        </Row>
      </Section>

      {notes && (
        <Text className="text-gray-700 mb-6">
          <strong>Opmerking:</strong> {notes}
        </Text>
      )}

      <Section className="text-center my-8">
        <Button
          href={signingUrl}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-base"
        >
          Bekijk en onderteken offerte
        </Button>
      </Section>

      {expiryDate && (
        <Text className="text-sm text-gray-600 mb-6 text-center">
          Deze ondertekeningslink is geldig tot <strong>{expiryDate}</strong>.
        </Text>
      )}

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
        Deze e-mail is automatisch verzonden. Als u vragen heeft over de offerte,
        neem dan contact op met {companyName}.
      </Text>
    </EmailLayout>
  )
}
