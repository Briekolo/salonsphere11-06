'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';
import { use } from 'react';

export default function PrivacyPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const { tenant } = useTenant();
  const effectiveDate = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href={`/${resolvedParams.domain}`}>
          <button className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
            <ChevronLeft className="h-5 w-5" />
            Terug naar home
          </button>
        </Link>

        <h1 className="text-4xl font-bold text-[#02011F] mb-4">Gegevensbeschermingsbeleid</h1>
        <p className="text-gray-600 mb-8">Laatst bijgewerkt: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">1. Inleiding</h2>
            <p className="text-gray-700 mb-4">
              {tenant?.name || 'Wij'} hechten grote waarde aan de bescherming van uw persoonsgegevens. In dit 
              privacy beleid leggen wij uit hoe wij omgaan met uw persoonsgegevens die wij verzamelen wanneer u 
              gebruik maakt van onze diensten.
            </p>
            <p className="text-gray-700 mb-4">
              Dit privacy beleid is van toepassing op alle persoonsgegevens die wij verwerken van klanten, 
              bezoekers van onze website en andere betrokkenen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">2. Verwerkingsverantwoordelijke</h2>
            <p className="text-gray-700 mb-4">
              De verwerkingsverantwoordelijke voor de verwerking van uw persoonsgegevens is:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700"><strong>{tenant?.name || 'Salon'}</strong></p>
              {tenant?.address && <p className="text-gray-700">{tenant.address}</p>}
              {tenant?.city && <p className="text-gray-700">{tenant.postal_code} {tenant.city}</p>}
              {tenant?.email && <p className="text-gray-700">Email: {tenant.email}</p>}
              {tenant?.phone && <p className="text-gray-700">Telefoon: {tenant.phone}</p>}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">3. Welke gegevens verzamelen wij?</h2>
            <p className="text-gray-700 mb-4">Wij verzamelen de volgende categorieën persoonsgegevens:</p>
            
            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.1 Contactgegevens</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Voor- en achternaam</li>
              <li>Adresgegevens</li>
              <li>Telefoonnummer</li>
              <li>E-mailadres</li>
              <li>Geboortedatum</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.2 Behandelgegevens</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Afspraakhistorie</li>
              <li>Uitgevoerde behandelingen</li>
              <li>Medische informatie relevant voor behandelingen</li>
              <li>Allergieën en huidtype</li>
              <li>Voorkeuren en notities</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.3 Financiële gegevens</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Factuurgegevens</li>
              <li>Betalingshistorie</li>
              <li>Betaalmethode</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">4. Waarom verwerken wij uw gegevens?</h2>
            <p className="text-gray-700 mb-4">Wij verwerken uw persoonsgegevens voor de volgende doeleinden:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Het uitvoeren van de overeenkomst voor beauty behandelingen</li>
              <li>Het maken en beheren van afspraken</li>
              <li>Het contact met u opnemen over uw afspraak</li>
              <li>Het versturen van herinneringen voor afspraken</li>
              <li>Het bijhouden van uw behandelhistorie voor optimale service</li>
              <li>Het voldoen aan wettelijke verplichtingen (zoals belastingaangifte)</li>
              <li>Het verbeteren van onze dienstverlening</li>
              <li>Het versturen van marketingcommunicatie (alleen met uw toestemming)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">5. Rechtsgronden</h2>
            <p className="text-gray-700 mb-4">
              Wij verwerken uw persoonsgegevens op basis van de volgende rechtsgronden:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Uitvoering overeenkomst:</strong> Voor het leveren van onze diensten</li>
              <li><strong>Wettelijke verplichting:</strong> Voor het voldoen aan fiscale en administratieve verplichtingen</li>
              <li><strong>Gerechtvaardigd belang:</strong> Voor het verbeteren van onze diensten en klantenservice</li>
              <li><strong>Toestemming:</strong> Voor het versturen van marketingberichten</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">6. Bewaartermijnen</h2>
            <p className="text-gray-700 mb-4">
              Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn verzameld:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Klantgegevens: 7 jaar na laatste behandeling</li>
              <li>Financiële gegevens: 7 jaar (wettelijke bewaarplicht)</li>
              <li>Medische/behandelgegevens: 20 jaar (conform WGBO)</li>
              <li>Marketinggegevens: Tot intrekking toestemming</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">7. Met wie delen wij uw gegevens?</h2>
            <p className="text-gray-700 mb-4">
              Wij delen uw persoonsgegevens alleen met derden als dit noodzakelijk is:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Boekhouder/accountant voor financiële administratie</li>
              <li>IT-dienstverleners voor systeembeheer</li>
              <li>Betalingsdienstverleners voor afhandeling betalingen</li>
              <li>Overheidsinstanties indien wettelijk verplicht</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Met alle verwerkers hebben wij verwerkersovereenkomsten afgesloten om de beveiliging van uw gegevens te waarborgen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">8. Beveiliging</h2>
            <p className="text-gray-700 mb-4">
              Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beveiligen tegen:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Ongeautoriseerde toegang</li>
              <li>Verlies of diefstal</li>
              <li>Wijziging of vernietiging</li>
              <li>Onrechtmatige verwerking</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Onze medewerkers zijn gebonden aan geheimhouding en krijgen alleen toegang tot gegevens die zij nodig hebben.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">9. Uw rechten</h2>
            <p className="text-gray-700 mb-4">
              Onder de AVG heeft u de volgende rechten:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u verwerken</li>
              <li><strong>Recht op rectificatie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
              <li><strong>Recht op verwijdering:</strong> U kunt verzoeken om verwijdering van uw gegevens</li>
              <li><strong>Recht op beperking:</strong> U kunt de verwerking laten beperken</li>
              <li><strong>Recht op dataportabiliteit:</strong> U kunt uw gegevens ontvangen of laten overdragen</li>
              <li><strong>Recht op bezwaar:</strong> U kunt bezwaar maken tegen de verwerking</li>
              <li><strong>Recht om toestemming in te trekken:</strong> Voor verwerkingen gebaseerd op toestemming</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Voor het uitoefenen van deze rechten kunt u contact met ons opnemen via de contactgegevens onderaan dit beleid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">10. Cookies</h2>
            <p className="text-gray-700 mb-4">
              Onze website maakt gebruik van cookies. Voor meer informatie verwijzen wij u naar ons 
              <Link href={`/${resolvedParams.domain}/cookies`} className="text-blue-600 hover:underline ml-1">
                Cookiebeleid
              </Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">11. Klachten</h2>
            <p className="text-gray-700 mb-4">
              Als u niet tevreden bent over hoe wij met uw persoonsgegevens omgaan, kunt u een klacht indienen bij:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Ons via de contactgegevens hieronder</li>
              <li>De Autoriteit Persoonsgegevens (www.autoriteitpersoonsgegevens.nl)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">12. Wijzigingen</h2>
            <p className="text-gray-700 mb-4">
              Wij kunnen dit privacy beleid van tijd tot tijd aanpassen. De meest recente versie vindt u altijd op onze website. 
              Bij substantiële wijzigingen zullen wij u hierover informeren.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">13. Contact</h2>
            <p className="text-gray-700 mb-4">
              Voor vragen over dit privacy beleid of het uitoefenen van uw rechten kunt u contact met ons opnemen:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>{tenant?.name || 'Salon'}</strong></p>
              {tenant?.address && <p className="text-gray-700">{tenant.address}</p>}
              {tenant?.city && <p className="text-gray-700">{tenant.postal_code} {tenant.city}</p>}
              {tenant?.email && <p className="text-gray-700">Email: {tenant.email}</p>}
              {tenant?.phone && <p className="text-gray-700">Telefoon: {tenant.phone}</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}