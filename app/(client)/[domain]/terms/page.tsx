'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';
import { use } from 'react';

export default function TermsPage({ params }: { params: Promise<{ domain: string }> }) {
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

        <h1 className="text-4xl font-bold text-[#02011F] mb-4">Algemene Voorwaarden</h1>
        <p className="text-gray-600 mb-8">Laatst bijgewerkt: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">1. Toepasselijkheid</h2>
            <p className="text-gray-700 mb-4">
              Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten tussen {tenant?.name || 'de salon'} 
              (hierna: "wij", "ons" of "de salon") en de klant met betrekking tot beauty- en verzorgingsbehandelingen.
            </p>
            <p className="text-gray-700 mb-4">
              Door het maken van een afspraak of het ontvangen van onze diensten, accepteert u deze voorwaarden.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">2. Afspraken</h2>
            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.1 Boeken van afspraken</h3>
            <p className="text-gray-700 mb-4">
              Afspraken kunnen online, telefonisch of persoonlijk in de salon worden gemaakt. Bij het maken van een 
              afspraak gaat u akkoord met de gereserveerde tijd en de gekozen behandeling.
            </p>
            
            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.2 Annulering</h3>
            <p className="text-gray-700 mb-4">
              Afspraken dienen minimaal 24 uur van tevoren te worden geannuleerd. Bij annulering binnen 24 uur of 
              no-show kunnen wij 50% van de behandelingskosten in rekening brengen.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.3 Te laat komen</h3>
            <p className="text-gray-700 mb-4">
              Bij het te laat komen wordt de behandeltijd ingekort met de tijd die u te laat bent, om volgende 
              klanten niet te laten wachten. Het volledige bedrag blijft verschuldigd.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">3. Prijzen en Betaling</h2>
            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.1 Prijzen</h3>
            <p className="text-gray-700 mb-4">
              Alle prijzen zijn in euro's en inclusief BTW. Wij behouden het recht om prijzen te wijzigen. 
              De prijs die geldt op het moment van boeking is van toepassing.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.2 Betaling</h3>
            <p className="text-gray-700 mb-4">
              Betaling dient direct na de behandeling te geschieden. Wij accepteren contant geld, pin en 
              contactloze betalingen. Betalingen zijn definitief en niet restitueerbaar, tenzij anders overeengekomen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">4. Behandelingen</h2>
            <h3 className="text-xl font-medium text-[#02011F] mb-2">4.1 Informatieplicht klant</h3>
            <p className="text-gray-700 mb-4">
              U bent verplicht om relevante medische informatie, allergieën of huidaandoeningen voor aanvang van 
              de behandeling te melden. Het verzwijgen van informatie kan leiden tot het weigeren van de behandeling.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">4.2 Resultaten</h3>
            <p className="text-gray-700 mb-4">
              Wij spannen ons in om het beste resultaat te behalen, maar kunnen geen garanties geven over het 
              eindresultaat van een behandeling, aangezien dit per persoon kan verschillen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">5. Aansprakelijkheid</h2>
            <p className="text-gray-700 mb-4">
              Wij zijn niet aansprakelijk voor schade die ontstaat door het niet naleven van nazorginstructies of 
              het verzwijgen van relevante medische informatie.
            </p>
            <p className="text-gray-700 mb-4">
              In geval van schade door onze schuld is onze aansprakelijkheid beperkt tot het bedrag van de behandeling, 
              tenzij er sprake is van opzet of grove nalatigheid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">6. Klachten</h2>
            <p className="text-gray-700 mb-4">
              Klachten over onze diensten dienen zo spoedig mogelijk, maar uiterlijk binnen 7 dagen na de behandeling, 
              schriftelijk of per e-mail bij ons te worden ingediend. Wij streven ernaar klachten binnen 14 dagen af te handelen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">7. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Wij gaan zorgvuldig om met uw persoonlijke gegevens conform ons privacy beleid en de geldende 
              privacywetgeving (AVG/GDPR).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">8. Toepasselijk Recht</h2>
            <p className="text-gray-700 mb-4">
              Op deze algemene voorwaarden is Nederlands recht van toepassing. Geschillen zullen worden voorgelegd 
              aan de bevoegde rechter in Nederland.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">9. Contact</h2>
            <p className="text-gray-700 mb-4">
              Voor vragen over deze algemene voorwaarden kunt u contact met ons opnemen:
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