---
title: "Facturen versturen met iDEAL of Wero — sneller betaald als zzp'er (2026)"
seoTitle: "Facturen versturen met iDEAL of Wero — sneller betaald als zzp'er (2026)"
metaDescription: "Alles over betaallinks op facturen: hoe iDEAL en Wero werken, hoe je ze instelt via Mollie, en waarom je er gemiddeld 11 dagen sneller mee betaald wordt."
excerpt: "Alles over betaallinks op facturen: hoe iDEAL en Wero werken, hoe je ze instelt via Mollie, en waarom je er gemiddeld 11 dagen sneller mee betaald wordt."
image: blog/4-facturen-versturen-met-iDEAL-betalingslink.jpg
date: "2026-02-13"
updatedAt: "2026-02-14"
category: facturatie
readTime: 8
author: Declair Redactie
authorRole: Slimme facturatie voor zzp'ers
canonical: "https://declair.app/blog/facturen-versturen-met-iDEAL-betalingslink"
keywords:
  - iDEAL betaallink factuur
  - factuur met betaallink versturen
  - Wero betaling factuur
  - sneller betaald worden zzp
  - iDEAL factuur zzp
  - betaallink factuurprogramma
  - Mollie iDEAL instellen
howToSteps:
  - name: "Maak een Mollie-account aan"
    text: "Ga naar mollie.com en registreer een gratis account. Voltooi de verificatie van je bedrijfsgegevens (KvK, IBAN)."
  - name: "Kopieer je Mollie API-sleutel"
    text: "Ga in het Mollie-dashboard naar Developers > API-sleutels. Kopieer je live API-sleutel."
  - name: "Koppel Mollie aan Declair"
    text: "Ga in Declair naar Instellingen > Betalingen. Plak je Mollie API-sleutel en test de verbinding."
  - name: "Stuur een factuur met betaallink"
    text: "Maak een factuur aan en verstuur deze. De iDEAL-betaallink wordt automatisch toegevoegd. Je klant kan direct betalen via de knop in de e-mail of via de QR-code op de PDF."
faq:
  - question: "Wat kost een iDEAL-betaling op een factuur?"
    answer: "Declair rekent geen transactiekosten. Je betaalt alleen de kosten van Mollie: €0,29 per iDEAL-transactie. Voor creditcardbetalingen geldt 1,8% + €0,25. Je kunt deze kosten als zakelijke kosten aftrekken."
  - question: "Wat is Wero en verschilt het van iDEAL?"
    answer: "Wero is een nieuw Europees betaalnetwerk dat is opgezet door grote Europese banken. Waar iDEAL alleen in Nederland werkt, is Wero beschikbaar in meerdere EU-landen (Nederland, België, Duitsland, Frankrijk). Voor zzp'ers met internationale klanten is Wero daardoor een waardevolle aanvulling op iDEAL."
  - question: "Kan mijn klant ook betalen zonder iDEAL?"
    answer: "Ja. Via Mollie kun je naast iDEAL ook creditcard, Wero en andere betaalmethoden aanbieden. Je klant ziet op de betaalpagina welke opties beschikbaar zijn en kiest zelf."
  - question: "Hoe weet ik wanneer mijn klant heeft betaald?"
    answer: "Zodra de betaling is verwerkt, ontvang je een e-mailnotificatie en wordt de factuurstatus in Declair automatisch bijgewerkt naar 'betaald'. Je klant ontvangt tegelijkertijd een automatische betalingsbevestiging."
  - question: "Werkt een iDEAL-betaallink ook op mobiel?"
    answer: "Ja. De betaalpagina is volledig mobielvriendelijk. Op een smartphone opent de betaallink direct de bankapp van de klant. De QR-code op de PDF-factuur is ook te scannen met de camera van een smartphone."
  - question: "Kan ik een betaallink toevoegen aan een al verstuurde factuur?"
    answer: "Ja. Je kunt in Declair een bestaande factuur opnieuw versturen met betaallink, of de betaallink los kopiëren en naar je klant sturen via e-mail of WhatsApp."
  - question: "Wat als mijn klant de betaallink niet gebruikt en toch overmaakt?"
    answer: "Geen probleem. Je kunt de factuur handmatig op 'betaald' zetten in Declair. De betaallink vervalt automatisch zodra je dit doet."
  - question: "Is een Mollie-account verplicht voor iDEAL-betaallinks?"
    answer: "Ja, Declair gebruikt Mollie als betaalprovider voor iDEAL en creditcardbetalingen. Een Mollie-account aanmaken is gratis — je betaalt alleen per transactie."
---

Wachten op een overboeking is een van de frustrerendste kanten van het zzp-leven. Je hebt het werk afgerond, de factuur verstuurd — en dan… niets. Geen notificatie, geen zekerheid, gewoon wachten.

Met een betaallink op je factuur verander je dat volledig. Je klant klikt op een knop, kiest zijn bank, en betaalt in dertig seconden. Geen handmatig overtypen van IBAN-nummers, geen vergeten betalingen.

In dit artikel leggen we uit hoe iDEAL-betaallinks en het nieuwe Wero werken, hoe je ze instelt via Mollie en Declair, en wat de echte impact is op je betaaltijden.

---

## Waarom wachten op een overboeking te lang duurt

De gemiddelde betaaltermijn bij zzp'ers zonder betaallink is **30 tot 45 dagen** na factuurdatum. Veel klanten betalen pas als ze er een herinnering over krijgen — niet uit onwil, maar omdat een factuur makkelijk ondersneeuwen in een drukke e-mailinbox.

Een betaallink op je factuur neemt elke drempel weg:

- De klant hoeft geen IBAN over te typen
- Geen zoeken naar de factuur als de betaaltermijn verloopt
- Directe koppeling met de bankapp van de klant
- Bevestiging voor zowel jou als de klant op het moment van betaling

Het resultaat: zzp'ers die betaallinks gebruiken worden gemiddeld **11 dagen sneller betaald** dan zzp'ers die alleen een IBAN vermelden.

---

## Twee betaalmethoden voor Nederlandse zzp'ers

### iDEAL — de Nederlandse standaard

iDEAL is de meest gebruikte online betaalmethode in Nederland, goed voor meer dan 70% van alle online betalingen. Vrijwel elke Nederlander heeft een bank die iDEAL ondersteunt: ABN AMRO, ING, Rabobank, SNS, ASN, Triodos, Bunq en tientallen andere.

Voor zzp'ers die voornamelijk aan Nederlandse klanten factureren is iDEAL de beste keuze: vertrouwd, direct en met lage transactiekosten (€0,29 per betaling via Mollie).

**Hoe het werkt voor je klant:**

1. Klant ontvangt je factuur per e-mail
1. Klant klikt op de blauwe betaalknop
1. Klant kiest zijn bank op de Mollie-betaalpagina
1. Klant logt in op zijn bankapp en keurt de betaling goed
1. Betaling is direct verwerkt — jij ontvangt een notificatie

Het hele proces duurt minder dan 60 seconden.

---

### Wero — het nieuwe Europese alternatief

Wero is een nieuw betaalnetwerk dat in 2024 is gelanceerd door een consortium van grote Europese banken, waaronder ING, ABN AMRO, BNP Paribas en Deutsche Bank. Het doel: één Europees betaalsysteem dat werkt over landsgrenzen heen.

**Waarom Wero interessant is voor zzp'ers:**

|                    |iDEAL              |Wero                                                    |
|--------------------|-------------------|--------------------------------------------------------|
|**Landen**          |Alleen Nederland   |Nederland, België, Duitsland, Frankrijk (en uitbreidend)|
|**Doelgroep**       |Nederlandse klanten|Europese klanten                                        |
|**Transactiekosten**|€0,29 via Mollie   |Vergelijkbaar                                           |
|**Directe betaling**|✅                  |✅                                                       |
|**Bekendheid NL**   |Zeer hoog          |Groeiend                                                |

Voor zzp'ers met klanten in andere EU-landen is Wero een waardevolle aanvulling. Een Belgische of Duitse klant hoeft niet te weten wat iDEAL is — met Wero betalen ze via een methode die ze al kennen van hun eigen bank.

> **First-mover kans:** Wero is nieuw en groeit snel. Zzp'ers die nu al Wero-betaallinks aanbieden op hun facturen onderscheiden zich van concurrenten die alleen iDEAL kennen.

---

## Kosten — wat betaal je per transactie?

Declair rekent **geen transactiekosten**. Je betaalt alleen de kosten van Mollie, de betaalprovider:

|Betaalmethode               |Kosten per transactie  |
|----------------------------|-----------------------|
|iDEAL                       |€0,29                  |
|Creditcard (Visa/Mastercard)|1,8% + €0,25           |
|Wero                        |Vergelijkbaar met iDEAL|

Een factuur van €500 via iDEAL kost je dus €0,29. Die kosten mag je als zakelijke uitgave aftrekken. Vergeleken met de tijdwinst en het snellere betaalgedrag is dit verwaarloosbaar.

Mollie is gratis te registreren. Je betaalt alleen per geslaagde transactie — geen maandelijks abonnement.

---

## Instellen in 4 stappen

### Stap 1 — Maak een Mollie-account aan

Ga naar [mollie.com](https://www.mollie.com) en registreer een gratis account. Je hebt nodig:

- Je bedrijfsnaam en KvK-nummer
- Je IBAN (waarop betalingen worden uitbetaald)
- Een geldig e-mailadres

De verificatie duurt doorgaans 1–2 werkdagen. Mollie betaalt ontvangen betalingen dagelijks of wekelijks uit naar je IBAN.

### Stap 2 — Kopieer je API-sleutel

Log in op het Mollie-dashboard. Ga naar **Developers → API-sleutels** en kopieer je **live API-sleutel** (begint met `live_`).

> Gebruik voor het testen de **test API-sleutel** (`test_`). Dan kun je het betaalproces doorlopen zonder echte betalingen te verwerken.

### Stap 3 — Koppel Mollie aan Declair

Ga in Declair naar **Instellingen → Betalingen**. Plak je Mollie API-sleutel in het veld en sla op. Klik op "Verbinding testen" om te controleren of alles werkt.

Je kunt kiezen of je start in testmodus (voor proefbetalingen) of direct in live-modus.

### Stap 4 — Verstuur je eerste factuur met betaallink

Maak een factuur aan zoals je dat normaal doet. Zodra Mollie is gekoppeld, wordt de iDEAL-betaallink automatisch toegevoegd aan:

- De e-mail die je klant ontvangt (als knop)
- De PDF van de factuur (als klikbare link én als QR-code)

Je klant ziet de betaaloptie direct — zonder extra stappen van jouw kant.

---

## De betaalpagina — wat ziet je klant?

Je klant klikt op de betaalknop en komt op een door Mollie gehoste betaalpagina. Die pagina toont:

- Het te betalen bedrag
- Jouw bedrijfsnaam en factuuromschrijving
- De beschikbare betaalmethoden (iDEAL, Wero, creditcard — afhankelijk van wat je hebt ingeschakeld)
- Een keuzemenu voor de bank (bij iDEAL)

De pagina is volledig **mobielvriendelijk**. Op een smartphone opent de betaalknop direct de bankapp van de klant — één keer Face ID of vingerafdruk, en de betaling is gedaan.

De **QR-code op de PDF** werkt ook: klant scant de code met zijn telefoon, de betaalpagina opent, en betaling volgt in seconden.

---

## Automatische betalingsherinneringen combineren

Een betaallink is krachtig — maar gecombineerd met automatische herinneringen is het nóg effectiever. Veel klanten openen de factuur-e-mail wel, maar scrollen er pas doorheen als ze er een herinnering over krijgen.

Met Declair Professional stel je automatische herinneringen in die de betaallink opnieuw meesturen:

|Herinnering             |Timing                  |Toon                            |
|------------------------|------------------------|--------------------------------|
|Vriendelijke herinnering|3 dagen vóór vervaldatum|Vriendelijk, informerend        |
|Eerste herinnering      |7 dagen ná vervaldatum  |Neutraal, zakelijk              |
|Tweede herinnering      |14 dagen ná vervaldatum |Formeler, met urgentie          |
|Laatste aanmaning       |30 dagen ná vervaldatum |Formeel, verwijzing naar incasso|

Elke herinnering bevat automatisch de betaallink — je klant hoeft niet te zoeken naar de originele factuur.

---

## iDEAL-betaallink op een al verstuurde factuur

Heb je een factuur al verstuurd zonder betaallink, maar wil je die alsnog toevoegen? Dat kan op twee manieren:

**Optie 1 — Opnieuw versturen vanuit Declair:**
Open de factuur, klik op "Opnieuw versturen". De betaallink wordt automatisch meegestuurd als Mollie is gekoppeld.

**Optie 2 — Betaallink kopiëren en los sturen:**
Open de factuur in Declair en kopieer de betaallink. Stuur die via e-mail, WhatsApp of SMS direct naar je klant.

---

## Veelgemaakte fouten bij betaallinks

### Fout 1 — Mollie nog in testmodus laten staan

Vergeet niet om na het testen over te schakelen naar live-modus. In testmodus verwerkt Mollie geen echte betalingen.

### Fout 2 — Alleen iDEAL inschakelen voor internationale klanten

Een Belgische of Duitse klant heeft geen iDEAL-rekening. Schakel ook Wero en/of creditcard in als je aan klanten buiten Nederland factureert.

### Fout 3 — Transactiekosten niet opnemen in je uurtarief

€0,29 per iDEAL-betaling is verwaarloosbaar, maar als je tientallen facturen per maand verstuurt loopt het op. Zorg dat je tarief deze kosten dekt — of geef ze door aan de klant via een kleine toeslag.

### Fout 4 — Betaalpagina niet testen voor je live gaat

Test het volledige betaalproces minstens één keer in testmodus: klik de betaalknop, doorloop de betaling en controleer of de factuurstatus in Declair bijgewerkt wordt.

---

## Samenvatting

Een iDEAL- of Wero-betaallink op je factuur is de snelste manier om gemiddeld 11 dagen eerder betaald te worden. De setup via Mollie kost je eenmalig tien minuten, de kosten zijn €0,29 per transactie, en het werkt volledig automatisch voor elke factuur die je daarna verstuurt.

Voor zzp'ers met Nederlandse klanten is iDEAL de beste keuze. Voor zzp'ers met klanten in andere EU-landen is Wero een slimme aanvulling — en je bent er vroeg bij.

**[Koppel Mollie aan Declair en stuur je eerste factuur met betaallink →](https://declair.app/register)**

---

## Veelgestelde vragen

### Wat kost een iDEAL-betaling op een factuur?

Declair rekent geen transactiekosten. Je betaalt alleen de kosten van Mollie: €0,29 per iDEAL-transactie. Voor creditcardbetalingen geldt 1,8% + €0,25. Je kunt deze kosten als zakelijke kosten aftrekken.

### Wat is Wero en verschilt het van iDEAL?

Wero is een nieuw Europees betaalnetwerk opgezet door grote Europese banken. Waar iDEAL alleen in Nederland werkt, is Wero beschikbaar in meerdere EU-landen (Nederland, België, Duitsland, Frankrijk). Voor zzp'ers met internationale klanten is Wero daardoor een waardevolle aanvulling op iDEAL.

### Kan mijn klant ook betalen zonder iDEAL?

Ja. Via Mollie kun je naast iDEAL ook creditcard, Wero en andere betaalmethoden aanbieden. Je klant ziet op de betaalpagina welke opties beschikbaar zijn en kiest zelf.

### Hoe weet ik wanneer mijn klant heeft betaald?

Zodra de betaling is verwerkt, ontvang je een e-mailnotificatie en wordt de factuurstatus in Declair automatisch bijgewerkt naar "betaald". Je klant ontvangt tegelijkertijd een automatische betalingsbevestiging.

### Werkt een iDEAL-betaallink ook op mobiel?

Ja. De betaalpagina is volledig mobielvriendelijk. Op een smartphone opent de betaallink direct de bankapp van de klant. De QR-code op de PDF-factuur is ook te scannen met de camera van een smartphone.

### Kan ik een betaallink toevoegen aan een al verstuurde factuur?

Ja. Je kunt in Declair een bestaande factuur opnieuw versturen met betaallink, of de betaallink los kopiëren en naar je klant sturen via e-mail of WhatsApp.

### Wat als mijn klant de betaallink niet gebruikt en toch overmaakt?

Geen probleem. Je kunt de factuur handmatig op "betaald" zetten in Declair. De betaallink vervalt automatisch zodra je dit doet.

### Is een Mollie-account verplicht voor iDEAL-betaallinks?

Ja, Declair gebruikt Mollie als betaalprovider voor iDEAL en creditcardbetalingen. Een Mollie-account aanmaken is gratis — je betaalt alleen per transactie.

---

*Meer weten over sneller betaald worden? Lees ook [hoe automatische betalingsherinneringen werken](/blog/hoe-maak-je-een-factuur-als-zzper) of bekijk de [vergelijking van facturatieprogramma's](/blog/beste-facturatieprogramma-voor-zzpers-2026) om te zien welke tools betaallinks ondersteunen.*
