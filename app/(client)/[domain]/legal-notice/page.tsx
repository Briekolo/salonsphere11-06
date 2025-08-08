'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';
import { use } from 'react';

export default function LegalNoticePage({ params }: { params: Promise<{ domain: string }> }) {
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

        <h1 className="text-4xl font-bold text-[#02011F] mb-4">Juridische Kennisgeving</h1>
        <p className="text-gray-600 mb-8">Laatst bijgewerkt: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">1. Bedrijfsgegevens</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-2"><strong>Handelsnaam:</strong> {tenant?.name || 'Salon'}</p>
              {tenant?.address && (
                <>
                  <p className="text-gray-700 mb-2"><strong>Vestigingsadres:</strong></p>
                  <p className="text-gray-700">{tenant.address}</p>
                  <p className="text-gray-700 mb-2">{tenant.postal_code} {tenant.city}</p>
                </>
              )}
              {tenant?.phone && <p className="text-gray-700 mb-2"><strong>Telefoon:</strong> {tenant.phone}</p>}
              {tenant?.email && <p className="text-gray-700 mb-2"><strong>E-mail:</strong> {tenant.email}</p>}
              <p className="text-gray-700 mb-2"><strong>KvK-nummer:</strong> [KvK nummer]</p>
              <p className="text-gray-700 mb-2"><strong>BTW-identificatienummer:</strong> NL[BTW nummer]</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">2. Eigendomsrechten</h2>
            <p className="text-gray-700 mb-4">
              Alle rechten van intellectuele eigendom met betrekking tot deze website, inclusief maar niet beperkt tot 
              auteursrechten, merkrechten, handelsnaamrechten, databankrechten en naburige rechten, berusten bij 
              {' '}{tenant?.name || 'ons'} of onze licentiegevers.
            </p>
            <p className="text-gray-700 mb-4">
              Niets uit deze website mag worden verveelvoudigd, opgeslagen in een geautomatiseerd gegevensbestand of 
              openbaar gemaakt, in enige vorm of op enige wijze, zonder voorafgaande schriftelijke toestemming.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">3. Gebruik van de website</h2>
            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.1 Toegestaan gebruik</h3>
            <p className="text-gray-700 mb-4">
              Deze website is bedoeld voor persoonlijk, niet-commercieel gebruik. U mag de website gebruiken voor:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Het bekijken van informatie over onze diensten</li>
              <li>Het maken van afspraken</li>
              <li>Het contact opnemen met ons</li>
              <li>Het lezen van nieuws en updates</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.2 Verboden gebruik</h3>
            <p className="text-gray-700 mb-4">Het is niet toegestaan om:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>De website te gebruiken op een manier die schade kan toebrengen</li>
              <li>Ongeautoriseerde toegang te verkrijgen tot onze systemen</li>
              <li>Malware, virussen of schadelijke code te verspreiden</li>
              <li>De website te gebruiken voor illegale activiteiten</li>
              <li>Geautomatiseerde systemen te gebruiken om data te verzamelen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">4. Disclaimer</h2>
            <h3 className="text-xl font-medium text-[#02011F] mb-2">4.1 Informatie op de website</h3>
            <p className="text-gray-700 mb-4">
              Wij streven ernaar de informatie op deze website zo accuraat en actueel mogelijk te houden. Ondanks deze 
              inspanningen kan de informatie onvolledig of onjuist zijn. Wij aanvaarden geen aansprakelijkheid voor 
              schade als gevolg van onjuistheden of onvolledigheden in de aangeboden informatie.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">4.2 Beschikbaarheid</h3>
            <p className="text-gray-700 mb-4">
              Wij kunnen niet garanderen dat de website altijd zonder onderbrekingen of storingen toegankelijk is. 
              Wij zijn niet aansprakelijk voor schade die het gevolg is van het (tijdelijk) niet beschikbaar zijn van de website.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">4.3 Externe links</h3>
            <p className="text-gray-700 mb-4">
              Deze website kan links bevatten naar externe websites. Wij hebben geen controle over de inhoud van deze 
              websites en aanvaarden geen aansprakelijkheid voor de inhoud daarvan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">5. Aansprakelijkheidsbeperking</h2>
            <p className="text-gray-700 mb-4">
              Behoudens opzet of grove schuld zijn wij niet aansprakelijk voor:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Directe of indirecte schade voortvloeiend uit het gebruik van de website</li>
              <li>Schade door onjuiste of onvolledige informatie</li>
              <li>Schade door technische storingen of onderhoud</li>
              <li>Schade door virussen of malware</li>
              <li>Gevolgschade of gederfde winst</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Indien aansprakelijkheid ondanks het bovenstaande wordt vastgesteld, is deze beperkt tot het bedrag dat 
              in het betreffende geval door onze aansprakelijkheidsverzekering wordt uitgekeerd.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">6. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Bij het gebruik van onze website kunnen wij persoonsgegevens van u verwerken. Wij gaan zorgvuldig om met 
              deze gegevens en houden ons aan de geldende privacywetgeving. Voor meer informatie verwijzen wij naar ons
              <Link href={`/${resolvedParams.domain}/privacy`} className="text-blue-600 hover:underline ml-1">
                Gegevensbeschermingsbeleid
              </Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">7. Cookies</h2>
            <p className="text-gray-700 mb-4">
              Deze website maakt gebruik van cookies. Voor meer informatie over hoe wij cookies gebruiken, verwijzen wij naar ons
              <Link href={`/${resolvedParams.domain}/cookies`} className="text-blue-600 hover:underline ml-1">
                Cookiebeleid
              </Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">8. Klachten en geschillen</h2>
            <h3 className="text-xl font-medium text-[#02011F] mb-2">8.1 Klachtenprocedure</h3>
            <p className="text-gray-700 mb-4">
              Als u een klacht heeft over onze website of diensten, neem dan contact met ons op via de onderstaande 
              contactgegevens. Wij zullen uw klacht zo spoedig mogelijk, maar uiterlijk binnen 14 dagen, behandelen.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">8.2 Geschillenbeslechting</h3>
            <p className="text-gray-700 mb-4">
              Wij zijn aangesloten bij [Geschillencommissie naam] voor de buitengerechtelijke afhandeling van geschillen. 
              U kunt een geschil voorleggen via het Europees ODR Platform: 
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">9. Toepasselijk recht</h2>
            <p className="text-gray-700 mb-4">
              Op deze juridische kennisgeving en het gebruik van deze website is uitsluitend Nederlands recht van toepassing.
            </p>
            <p className="text-gray-700 mb-4">
              Alle geschillen die verband houden met of voortvloeien uit deze juridische kennisgeving worden voorgelegd 
              aan de bevoegde rechter in Nederland, tenzij dwingend recht anders bepaalt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">10. Wijzigingen</h2>
            <p className="text-gray-700 mb-4">
              Wij behouden ons het recht voor deze juridische kennisgeving op ieder moment te wijzigen. De meest actuele 
              versie is altijd op deze website te vinden. Wij adviseren u deze kennisgeving regelmatig te raadplegen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">11. Contact</h2>
            <p className="text-gray-700 mb-4">
              Voor vragen over deze juridische kennisgeving of onze website kunt u contact met ons opnemen:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>{tenant?.name || 'Salon'}</strong></p>
              {tenant?.address && <p className="text-gray-700">{tenant.address}</p>}
              {tenant?.city && <p className="text-gray-700">{tenant.postal_code} {tenant.city}</p>}
              {tenant?.email && <p className="text-gray-700">Email: {tenant.email}</p>}
              {tenant?.phone && <p className="text-gray-700">Telefoon: {tenant.phone}</p>}
            </div>
            <p className="text-gray-700 mt-4">
              Wij streven ernaar binnen 2 werkdagen op uw vraag te reageren.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}