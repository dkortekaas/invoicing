import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';
import { ReactNode } from 'react';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';
const LOGO_URL = `${APP_URL}/logo.PNG`;

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-2xl">
            <Section className="bg-white rounded-lg shadow-sm p-8">
              <Section className="text-center mb-6">
                <Img
                  src={LOGO_URL}
                  alt="Declair"
                  width={120}
                  style={{ display: 'block', margin: '0 auto' }}
                  className="mx-auto"
                />
              </Section>
              {children}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
