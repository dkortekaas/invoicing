import { Heading, Text } from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface ReminderEmailProps {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  daysOverdue: number;
  reminderType: 'friendly' | 'first' | 'second' | 'final';
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
}

const REMINDER_MESSAGES = {
  friendly: {
    subject: 'Aanstaande vervaldatum factuur',
    greeting: 'Dit is een vriendelijke herinnering dat onderstaande factuur binnenkort vervalt.',
  },
  first: {
    subject: 'Herinnering betaling factuur',
    greeting: 'Wij hebben nog geen betaling ontvangen voor onderstaande factuur.',
  },
  second: {
    subject: 'Tweede herinnering betaling factuur',
    greeting: 'Dit is de tweede herinnering voor onderstaande onbetaalde factuur.',
  },
  final: {
    subject: 'Finale herinnering - spoedige betaling vereist',
    greeting: 'Dit is de laatste herinnering voor onderstaande factuur. Bij uitblijven van betaling zijn wij genoodzaakt verdere stappen te ondernemen.',
  },
};

export default function ReminderEmail({
  customerName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  total,
  daysOverdue,
  reminderType,
  companyName,
  companyEmail,
  companyPhone,
}: ReminderEmailProps) {
  const message = REMINDER_MESSAGES[reminderType];
  const isOverdue = daysOverdue > 0;

  return (
    <EmailLayout preview={`${message.subject} ${invoiceNumber}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        {message.subject}
      </Heading>

      <Text className="text-gray-700 mb-6">
        Beste {customerName},
      </Text>

      <Text className="text-gray-700 mb-6">
        {message.greeting}
      </Text>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <Text className="font-semibold text-gray-900 mb-2">
          Factuur {invoiceNumber}
        </Text>
        <Text className="text-sm text-gray-700">
          Factuurdatum: {invoiceDate}
          <br />
          Vervaldatum: {dueDate}
          {isOverdue && (
            <>
              <br />
              <span className="text-red-600 font-semibold">
                {daysOverdue} {daysOverdue === 1 ? 'dag' : 'dagen'} achterstallig
              </span>
            </>
          )}
          <br />
          <span className="text-xl font-bold">Totaalbedrag: {total}</span>
        </Text>
      </div>

      {reminderType === 'final' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <Text className="text-red-800 font-semibold">
            Let op: Dit is de laatste herinnering. Bij uitblijven van betaling 
            binnen 7 dagen kunnen wij genoodzaakt zijn:
          </Text>
          <ul className="text-sm text-red-700 mt-2 ml-4">
            <li>• Incassokosten in rekening te brengen</li>
            <li>• De vordering uit handen te geven</li>
            <li>• Toekomstige dienstverlening op te schorten</li>
          </ul>
        </div>
      )}

      <Text className="text-gray-700 mb-6">
        {isOverdue ? (
          <>
            Wij verzoeken u vriendelijk om het openstaande bedrag zo spoedig 
            mogelijk over te maken. Mocht u de betaling reeds hebben verricht, 
            dan kunt u deze e-mail als niet verzonden beschouwen.
          </>
        ) : (
          <>
            De vervaldatum van deze factuur is {dueDate}. Wij verzoeken u 
            vriendelijk om voor deze datum te betalen.
          </>
        )}
      </Text>

      <Text className="text-gray-700 mb-6">
        Heeft u vragen over deze factuur of is er een reden waarom betaling 
        vertraagd is? Neem dan contact met ons op. Wij denken graag met u mee.
      </Text>

      <Text className="text-sm text-gray-600 mt-8">
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
    </EmailLayout>
  );
}
