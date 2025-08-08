'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';
import { use } from 'react';

export default function ContentPolicyPage({ params }: { params: Promise<{ domain: string }> }) {
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

        <h1 className="text-4xl font-bold text-[#02011F] mb-4">Inhoudsbeleid</h1>
        <p className="text-gray-600 mb-8">Laatst bijgewerkt: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">1. Inleiding</h2>
            <p className="text-gray-700 mb-4">
              Dit inhoudsbeleid is van toepassing op alle content die wordt geplaatst op onze website, inclusief maar 
              niet beperkt tot reviews, reacties, foto's en andere door gebruikers gegenereerde inhoud. Door content te 
              plaatsen op onze website, gaat u akkoord met dit beleid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">2. Toegestane inhoud</h2>
            <p className="text-gray-700 mb-4">
              Wij moedigen u aan om content te delen die:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Eerlijk en authentiek is</li>
              <li>Relevant is voor onze diensten</li>
              <li>Respectvol is naar anderen</li>
              <li>Constructief en behulpzaam is</li>
              <li>Gebaseerd is op persoonlijke ervaringen</li>
              <li>Voldoet aan alle toepasselijke wetten en regelgeving</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">3. Verboden inhoud</h2>
            <p className="text-gray-700 mb-4">
              De volgende soorten inhoud zijn niet toegestaan:
            </p>
            
            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.1 Illegale content</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Content die illegale activiteiten bevordert</li>
              <li>Schending van intellectuele eigendomsrechten</li>
              <li>Content die fraude of misleiding bevordert</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.2 Schadelijke content</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Haatdragende uitingen of discriminatie</li>
              <li>Bedreiging, intimidatie of pesterijen</li>
              <li>Laster of smaad</li>
              <li>Content die geweld promoot</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.3 Ongepaste content</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Seksueel expliciete inhoud</li>
              <li>Obscene of aanstootgevende taal</li>
              <li>Spam of repetitieve berichten</li>
              <li>Commerciële advertenties zonder toestemming</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.4 Misleidende content</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Valse of misleidende informatie</li>
              <li>Nepreviews of valse testimonials</li>
              <li>Identiteitsfraude of zich voordoen als anderen</li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">3.5 Privacy schendingen</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Persoonlijke informatie van anderen zonder toestemming</li>
              <li>Foto's van anderen zonder toestemming</li>
              <li>Vertrouwelijke informatie</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">4. Reviews en testimonials</h2>
            <p className="text-gray-700 mb-4">
              Bij het plaatsen van reviews vragen wij u om:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Alleen reviews te plaatsen gebaseerd op werkelijke ervaringen</li>
              <li>Eerlijk en evenwichtig te zijn in uw beoordeling</li>
              <li>Relevante details te verstrekken die anderen kunnen helpen</li>
              <li>Geen reviews te plaatsen in ruil voor compensatie</li>
              <li>Geen reviews van concurrenten te plaatsen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">5. Foto's en afbeeldingen</h2>
            <p className="text-gray-700 mb-4">
              Bij het uploaden van foto's:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Upload alleen foto's waarvan u de rechten bezit</li>
              <li>Vraag toestemming voordat u foto's van anderen plaatst</li>
              <li>Plaats geen foto's die aanstootgevend kunnen zijn</li>
              <li>Zorg dat foto's relevant zijn voor de context</li>
              <li>Respecteer de privacy van anderen in foto's</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">6. Intellectueel eigendom</h2>
            <p className="text-gray-700 mb-4">
              Door content op onze website te plaatsen:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Garandeert u dat u de rechthebbende bent of toestemming heeft</li>
              <li>Verleent u ons een niet-exclusieve licentie om de content te gebruiken</li>
              <li>Blijft u de eigenaar van uw content</li>
              <li>Geeft u ons toestemming de content te modereren indien nodig</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">7. Moderatie</h2>
            <p className="text-gray-700 mb-4">
              Wij behouden ons het recht voor om:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Content te beoordelen voordat deze wordt gepubliceerd</li>
              <li>Content te verwijderen die dit beleid schendt</li>
              <li>Content aan te passen om persoonlijke informatie te beschermen</li>
              <li>Gebruikers te blokkeren die herhaaldelijk het beleid schenden</li>
              <li>Autoriteiten te informeren bij illegale content</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Wij zijn niet verplicht om alle content te monitoren, maar kunnen dit naar eigen inzicht doen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">8. Melden van overtredingen</h2>
            <p className="text-gray-700 mb-4">
              Als u content aantreft die dit beleid schendt, meld dit dan aan ons via:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {tenant?.email && <p className="text-gray-700">Email: {tenant.email}</p>}
              {tenant?.phone && <p className="text-gray-700">Telefoon: {tenant.phone}</p>}
            </div>
            <p className="text-gray-700 mb-4">
              Vermeld daarbij:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>De locatie van de content (URL of beschrijving)</li>
              <li>De reden waarom u denkt dat het beleid wordt geschonden</li>
              <li>Uw contactgegevens voor eventuele follow-up</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">9. Gevolgen van schending</h2>
            <p className="text-gray-700 mb-4">
              Bij schending van dit beleid kunnen wij:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Een waarschuwing geven</li>
              <li>Content verwijderen of aanpassen</li>
              <li>Uw account tijdelijk of permanent blokkeren</li>
              <li>Juridische stappen ondernemen indien nodig</li>
              <li>Autoriteiten informeren bij illegale activiteiten</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">10. Aansprakelijkheid</h2>
            <p className="text-gray-700 mb-4">
              Gebruikers zijn zelf verantwoordelijk voor de content die zij plaatsen. Wij zijn niet aansprakelijk voor 
              door gebruikers geplaatste content, maar zullen passende maatregelen nemen wanneer overtredingen worden gemeld.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">11. Wijzigingen</h2>
            <p className="text-gray-700 mb-4">
              Wij kunnen dit inhoudsbeleid van tijd tot tijd aanpassen. Significante wijzigingen worden aangekondigd op 
              onze website. Voortgezet gebruik van de website na wijzigingen betekent acceptatie van het aangepaste beleid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">12. Contact</h2>
            <p className="text-gray-700 mb-4">
              Voor vragen over dit inhoudsbeleid kunt u contact met ons opnemen:
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