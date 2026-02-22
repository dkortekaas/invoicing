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

interface QuoteSignedNotificationEmailProps {
  /** Naam van de eigenaar/gebruiker */
  userName: string
  quoteNumber: string
  signerName: string
  signerEmail: string
  signedAt: string
  total: string
  customerName: string
  /** Link naar de offerte in het dashboard */
  quoteUrl: string
  /** Link naar de factuur als die al aangemaakt is */
  invoiceUrl?: string
  invoiceNumber?: string
}

export default function QuoteSignedNotificationEmail({
  userName,
  quoteNumber,
  signerName,
  signerEmail,
  signedAt,
  total,
  customerName,
  quoteUrl,
  invoiceUrl,
  invoiceNumber,
}: QuoteSignedNotificationEmailProps) {
  return (
    <EmailLayout
      preview={`Offerte ${quoteNumber} is ondertekend door ${signerName}`}
    >
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Offerte ondertekend!
      </Heading>

      <Text className="text-gray-700 mb-6">Hallo {userName},</Text>

      <Text className="text-gray-700 mb-6">
        Goed nieuws! Offerte <strong>{quoteNumber}</strong> voor{" "}
        <strong>{customerName}</strong> is zojuist ondertekend door{" "}
        <strong>{signerName}</strong>.
      </Text>

      <Section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-green-800 mb-1">Offertenummer</Text>
            <Text className="font-semibold text-green-900">{quoteNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-green-800 mb-1">Klant</Text>
            <Text className="font-semibold text-green-900">{customerName}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-green-800 mb-1">Ondertekenaar</Text>
            <Text className="font-semibold text-green-900">{signerName}</Text>
            <Text className="text-sm text-green-700">{signerEmail}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-green-800 mb-1">Totaalbedrag</Text>
            <Text className="font-semibold text-xl text-green-900">{total}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-green-800 mb-1">Ondertekend op</Text>
            <Text className="font-semibold text-green-900">{signedAt}</Text>
          </Column>
        </Row>
      </Section>

      {invoiceUrl && invoiceNumber ? (
        <>
          <Text className="text-gray-700 mb-4">
            Er is automatisch een factuur aangemaakt op basis van de offerte:
          </Text>
          <Section className="text-center my-6">
            <Button
              href={invoiceUrl}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold mr-3"
            >
              Bekijk factuur {invoiceNumber}
            </Button>
          </Section>
        </>
      ) : (
        <Section className="text-center my-6">
          <Button
            href={quoteUrl}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Bekijk offerte
          </Button>
        </Section>
      )}

      <Hr className="my-6" />

      <Text className="text-xs text-gray-500">
        U ontvangt deze notificatie als eigenaar van het account. De klant heeft ook
        een bevestiging per e-mail ontvangen met de ondertekende offerte als bijlage.
      </Text>
    </EmailLayout>
  )
}
