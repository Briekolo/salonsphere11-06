'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';
import { use } from 'react';

export default function CookiesPage({ params }: { params: Promise<{ domain: string }> }) {
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

        <h1 className="text-4xl font-bold text-[#02011F] mb-4">Cookiebeleid</h1>
        <p className="text-gray-600 mb-8">Laatst bijgewerkt: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">1. Wat zijn cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies zijn kleine tekstbestanden die worden opgeslagen op uw computer of mobiele apparaat wanneer u 
              onze website bezoekt. Ze helpen ons om uw voorkeuren te onthouden, de website te verbeteren en u een 
              gepersonaliseerde ervaring te bieden.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">2. Welke cookies gebruiken wij?</h2>
            
            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.1 Noodzakelijke cookies</h3>
            <p className="text-gray-700 mb-4">
              Deze cookies zijn essentieel voor het functioneren van onze website. Zonder deze cookies kunnen bepaalde 
              onderdelen van de website niet werken.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie naam</th>
                    <th className="text-left py-2">Doel</th>
                    <th className="text-left py-2">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">session_id</td>
                    <td className="py-2">Sessie identificatie</td>
                    <td className="py-2">Sessie</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">auth_token</td>
                    <td className="py-2">Authenticatie</td>
                    <td className="py-2">7 dagen</td>
                  </tr>
                  <tr>
                    <td className="py-2">cookie_consent</td>
                    <td className="py-2">Cookie toestemming</td>
                    <td className="py-2">1 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.2 Functionele cookies</h3>
            <p className="text-gray-700 mb-4">
              Deze cookies onthouden uw voorkeuren en maken het mogelijk om de website aan te passen aan uw behoeften.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie naam</th>
                    <th className="text-left py-2">Doel</th>
                    <th className="text-left py-2">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">language</td>
                    <td className="py-2">Taalvoorkeur</td>
                    <td className="py-2">1 jaar</td>
                  </tr>
                  <tr>
                    <td className="py-2">timezone</td>
                    <td className="py-2">Tijdzone instelling</td>
                    <td className="py-2">1 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.3 Analytische cookies</h3>
            <p className="text-gray-700 mb-4">
              Met uw toestemming gebruiken wij analytische cookies om te begrijpen hoe bezoekers onze website gebruiken. 
              Deze informatie helpt ons de website te verbeteren.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie naam</th>
                    <th className="text-left py-2">Doel</th>
                    <th className="text-left py-2">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">_ga</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">2 jaar</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gid</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">24 uur</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">2.4 Marketing cookies</h3>
            <p className="text-gray-700 mb-4">
              Met uw expliciete toestemming kunnen wij marketing cookies plaatsen om u relevante advertenties te tonen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">3. Cookies van derden</h2>
            <p className="text-gray-700 mb-4">
              Sommige cookies worden geplaatst door diensten van derden die op onze website verschijnen, zoals:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Google Analytics voor website analyse</li>
              <li>YouTube voor het afspelen van video's</li>
              <li>Social media plugins voor het delen van content</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Wij hebben geen controle over deze cookies van derden. Raadpleeg de privacy verklaringen van deze 
              partijen voor meer informatie over hun cookiegebruik.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">4. Uw toestemming</h2>
            <p className="text-gray-700 mb-4">
              Bij uw eerste bezoek aan onze website vragen wij om uw toestemming voor het plaatsen van niet-noodzakelijke 
              cookies. U kunt uw toestemming op elk moment intrekken of uw voorkeuren aanpassen.
            </p>
            <p className="text-gray-700 mb-4">
              Noodzakelijke cookies worden altijd geplaatst omdat deze essentieel zijn voor het functioneren van de website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">5. Cookies beheren</h2>
            <p className="text-gray-700 mb-4">
              U heeft verschillende mogelijkheden om cookies te beheren:
            </p>
            
            <h3 className="text-xl font-medium text-[#02011F] mb-2">5.1 Via onze cookie instellingen</h3>
            <p className="text-gray-700 mb-4">
              U kunt uw cookie voorkeuren op elk moment aanpassen via de "Cookie voorkeuren" link in de footer van onze website.
            </p>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">5.2 Via uw browser</h3>
            <p className="text-gray-700 mb-4">
              De meeste browsers accepteren cookies automatisch, maar u kunt uw browserinstellingen wijzigen om cookies 
              te weigeren of u te waarschuwen wanneer een cookie wordt verzonden.
            </p>
            <p className="text-gray-700 mb-4">Instructies per browser:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Chrome</a></li>
              <li><a href="https://support.mozilla.org/nl/kb/cookies-verwijderen-gegevens-wissen-websites-opgeslagen" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firefox</a></li>
              <li><a href="https://support.apple.com/nl-nl/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/nl-nl/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Internet Explorer</a></li>
              <li><a href="https://support.microsoft.com/nl-nl/help/4468242/microsoft-edge-browsing-data-and-privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Edge</a></li>
            </ul>

            <h3 className="text-xl font-medium text-[#02011F] mb-2">5.3 Opt-out voor analytische cookies</h3>
            <p className="text-gray-700 mb-4">
              Voor Google Analytics kunt u de 
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                Google Analytics Opt-out Browser Add-on
              </a> installeren.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">6. Gevolgen van het uitschakelen van cookies</h2>
            <p className="text-gray-700 mb-4">
              Als u cookies uitschakelt, kunnen sommige functies van onze website mogelijk niet correct werken:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>U moet mogelijk opnieuw inloggen bij elk bezoek</li>
              <li>Uw voorkeuren worden niet onthouden</li>
              <li>Sommige interactieve functies werken mogelijk niet</li>
              <li>U kunt mogelijk geen online afspraken maken</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">7. Updates van dit cookiebeleid</h2>
            <p className="text-gray-700 mb-4">
              Wij kunnen dit cookiebeleid van tijd tot tijd bijwerken om veranderingen in onze praktijken of om andere 
              operationele, wettelijke of regelgevende redenen weer te geven. Controleer deze pagina regelmatig voor updates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#02011F] mb-4">8. Contact</h2>
            <p className="text-gray-700 mb-4">
              Heeft u vragen over ons cookiebeleid? Neem dan contact met ons op:
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