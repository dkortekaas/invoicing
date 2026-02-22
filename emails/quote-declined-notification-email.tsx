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

interface QuoteDeclinedNotificationEmailProps {
  /** Naam van de eigenaar/gebruiker */
  userName: string
  quoteNumber: string
  signerName: string
  signerEmail: string
  declinedAt: string
  total: string
  customerName: string
  /** Link naar de offerte in het dashboard */
  quoteUrl: string
  remarks?: string
}

export default function QuoteDeclinedNotificationEmail({
  userName,
  quoteNumber,
  signerName,
  signerEmail,
  declinedAt,
  total,
  customerName,
  quoteUrl,
  remarks,
}: QuoteDeclinedNotificationEmailProps) {
  return (
    <EmailLayout
      preview={`Offerte ${quoteNumber} is afgewezen door ${signerName}`}
    >
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        Offerte afgewezen
      </Heading>

      <Text className="text-gray-700 mb-6">Hallo {userName},</Text>

      <Text className="text-gray-700 mb-6">
        Offerte <strong>{quoteNumber}</strong> voor <strong>{customerName}</strong>{" "}
        is helaas afgewezen door <strong>{signerName}</strong>.
      </Text>

      <Section className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-red-800 mb-1">Offertenummer</Text>
            <Text className="font-semibold text-red-900">{quoteNumber}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-red-800 mb-1">Klant</Text>
            <Text className="font-semibold text-red-900">{customerName}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-red-800 mb-1">Afgewezen door</Text>
            <Text className="font-semibold text-red-900">{signerName}</Text>
            <Text className="text-sm text-red-700">{signerEmail}</Text>
          </Column>
          <Column>
            <Text className="text-sm text-red-800 mb-1">Totaalbedrag</Text>
            <Text className="font-semibold text-xl text-red-900">{total}</Text>
          </Column>
        </Row>
        <Row className="mt-3">
          <Column>
            <Text className="text-sm text-red-800 mb-1">Afgewezen op</Text>
            <Text className="font-semibold text-red-900">{declinedAt}</Text>
          </Column>
        </Row>
      </Section>

      {remarks && (
        <Section className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 mb-1">Reden van afwijzing</Text>
          <Text className="text-gray-800 italic">&ldquo;{remarks}&rdquo;</Text>
        </Section>
      )}

      <Text className="text-gray-700 mb-4">
        U kunt de offerte aanpassen en een nieuwe versie sturen, of contact opnemen
        met de klant voor meer informatie.
      </Text>

      <Section className="text-center my-6">
        <Button
          href={quoteUrl}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Bekijk offerte
        </Button>
      </Section>

      <Hr className="my-6" />

      <Text className="text-xs text-gray-500">
        U ontvangt deze notificatie als eigenaar van het account. De klant heeft geen
        bevestigings-e-mail ontvangen voor de afwijzing.
      </Text>
    </EmailLayout>
  )
}
