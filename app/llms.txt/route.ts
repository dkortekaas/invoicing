import { NextResponse } from "next/server";
import packageJson from "@/package.json";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://declair.nl";

function buildLlmsTxt(): string {
  const generatedAt = new Date().toISOString();
  const version = (packageJson as { version?: string }).version ?? "0.0.0";

  return `# Declair

> Nederlandse facturatie-app voor ZZP'ers en kleine ondernemers. Facturen, klanten, producten, urenregistratie, btw-rapportage en analytics, volledig in het Nederlands.

Declair is een webapplicatie voor het beheren van facturen, klanten, producten, kosten (met OCR en automatische categorisatie), terugkerende facturen, btw-rapportage en tijdregistratie. Alle gebruikersinterfaces en validatieberichten zijn in het Nederlands.

Tech stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma (PostgreSQL), NextAuth v5, Stripe, @react-pdf/renderer, Resend, Vercel Blob. Conventies: gebruikerstekst in het Nederlands; code in het Engels. Datums dd-MM-yyyy, bedragen € 1.234,56, btw 0/9/21%. Versie ${version}. Laatst gegenereerd: ${generatedAt}.

## Hoofdroutes

[Home](${APP_URL}/)
[Login](${APP_URL}/login)
[Registeren](${APP_URL}/register)
[Facturen](${APP_URL}/facturen)
[Klanten](${APP_URL}/klanten)
[Producten](${APP_URL}/producten)
[Kosten](${APP_URL}/kosten)
[Leveranciers](${APP_URL}/leveranciers)
[Abonnementen](${APP_URL}/abonnementen)
[BTW-rapportage](${APP_URL}/btw)
[Tijdregistratie](${APP_URL}/tijd)
[Dashboard](${APP_URL}/dashboard)
[Instellingen](${APP_URL}/instellingen)
[Prijzen](${APP_URL}/prijzen)
[Functies](${APP_URL}/functies)
[Blog](${APP_URL}/blog)
[Contact](${APP_URL}/contact)

## Documentatie

[CLAUDE.md](https://github.com/declair/invoicing/blob/main/CLAUDE.md) – Projectoverzicht en conventies voor ontwikkelaars.

## Optional

[Privacy](${APP_URL}/privacy)
[Algemene voorwaarden](${APP_URL}/algemene-voorwaarden)
[Cookiebeleid](${APP_URL}/cookie-beleid)
[Contact](${APP_URL}/contact)
`;
}

export function GET() {
  const body = buildLlmsTxt();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
    },
  });
}
