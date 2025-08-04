'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Package, 
  Mail, 
  Settings, 
  Shield, 
  Sparkles,
  BarChart3,
  Clock,
  Phone,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  Database,
  Globe,
  Smartphone,
  CreditCard,
  Bell,
  FileText,
  Zap,
  Lock,
  Eye,
  Star,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Play,
  Download,
  Upload,
  Filter,
  Tag,
  MapPin,
  Euro,
  PieChart
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface HelpSection {
  id: string
  title: string
  icon: any
  description: string
  subsections: {
    id: string
    title: string
    content: string
    features?: string[]
    tips?: string[]
    troubleshooting?: { problem: string; solution: string }[]
    shortcuts?: { key: string; action: string }[]
  }[]
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Aan de slag',
    icon: Play,
    description: 'Leer hoe je SalonSphere gebruikt en krijg snel toegang tot alle functionaliteiten',
    subsections: [
      {
        id: 'first-steps',
        title: 'Eerste stappen',
        content: `Welkom bij SalonSphere! Deze handleiding helpt je om snel van start te gaan met je salon management systeem.

**Wat is SalonSphere?**
SalonSphere is een complete salon management oplossing die je helpt bij het beheren van afspraken, klanten, voorraad, behandelingen en veel meer. Het systeem is speciaal ontworpen voor kappers, schoonheidsspecialisten en andere beauty professionals.

**Toegang tot je salon**
- Log in via je persoonlijke account
- Je salon is toegankelijk via je subdomain (bijvoorbeeld: jouwsalon.salonsphere.nl)
- Klanten kunnen online afspraken boeken via deze link

**Account types:**
- **Salon Eigenaar/Admin**: Volledige toegang tot alle functies
- **Medewerker**: Toegang tot eigen agenda en klantgegevens
- **Klant**: Kan afspraken boeken en eigen profiel beheren`,
        tips: [
          'Zorg ervoor dat je profiel compleet is ingevuld voor de beste ervaring',
          'Stel je openingstijden correct in voordat klanten gaan boeken',
          'Upload je salon logo voor een professionele uitstraling'
        ]
      },
      {
        id: 'navigation',
        title: 'Navigatie en interface',
        content: `**Hoofdnavigatie (Sidebar)**
De sidebar aan de linkerkant bevat alle hoofdfuncties:

- **Dashboard**: Overzicht van je salon prestaties
- **Agenda**: Beheer van alle afspraken en planning
- **Klantbeheer**: Alle klantinformatie en historie
- **Behandelingen**: Services, prijzen en categorieën
- **Voorraadbeheer**: Producten en voorraad tracking
- **E-mail Automatisering**: Geautomatiseerde communicatie
- **Instellingen**: Salon configuratie
- **Admin Panel**: Geavanceerde beheeropties (alleen voor admins)

**Top Bar**
- Notificaties bell icoon: Nieuwe berichten en waarschuwingen
- Profiel dropdown: Account instellingen en uitloggen
- Mobile menu toggle: Voor gebruik op telefoon/tablet`,
        shortcuts: [
          { key: 'Alt + D', action: 'Ga naar Dashboard' },
          { key: 'Alt + A', action: 'Ga naar Agenda' },
          { key: 'Alt + K', action: 'Ga naar Klanten' },
          { key: 'Alt + T', action: 'Ga naar Behandelingen' },
          { key: 'Alt + V', action: 'Ga naar Voorraad' },
          { key: 'Alt + S', action: 'Ga naar Instellingen' }
        ]
      },
      {
        id: 'initial-setup',
        title: 'Initiële configuratie',
        content: `**Verplichte instellingen**
Voordat je salon operationeel is, moet je het volgende configureren:

1. **Bedrijfsinformatie** (Instellingen → Algemeen)
   - Salon naam en adres
   - Contact informatie
   - BTW nummer (indien van toepassing)
   - Logo upload

2. **Openingstijden** (Instellingen → Openingstijden)
   - Reguliere openingstijden per dag
   - Pauzes en lunchpauzes
   - Feestdagen en speciale sluitingsdagen

3. **Behandelingen en services** (Behandelingen)
   - Voeg je services toe met prijzen
   - Stel behandelingsduur in
   - Maak categorieën aan voor betere organisatie

4. **Personeel** (Admin → Personeel)
   - Voeg medewerkers toe
   - Stel beschikbaarheid per medewerker in
   - Wijs services toe aan specifieke medewerkers

5. **Betaalmethoden** (Instellingen → Betalingen)
   - Configureer geaccepteerde betaalmethoden
   - Stel online betaling in (optioneel)`,
        tips: [
          'Neem de tijd om alle gegevens correct in te voeren - dit voorkomt problemen later',
          'Test je online booking systeem voordat je klanten de link geeft',
          'Maak een back-up van belangrijke gegevens tijdens de setup'
        ]
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    description: 'Krijg inzicht in de prestaties van je salon met real-time statistieken en analytics',
    subsections: [
      {
        id: 'dashboard-overview',
        title: 'Dashboard overzicht',
        content: `Het Dashboard is je centrale controlecentrum waar je alle belangrijke salon statistieken in één oogopslag ziet.

**Hoofdmetriek kaarten:**
- **Totale omzet**: Maandelijkse omzet en groei percentage
- **Aantal afspraken**: Afspraken deze maand vs vorige maand
- **Gemiddelde transactiewaarde**: Hoeveel klanten gemiddeld besteden
- **Verwachte omzet**: Gebaseerd op geplande afspraken

**Omzet grafieken:**
- **Maandelijkse omzet trend**: Zie hoe je salon groeit over tijd
- **Dagelijkse omzet**: Inzicht in je beste en slechtste dagen
- **Service populariteit**: Welke behandelingen het meest geboekt worden

**Recente activiteiten:**
- Nieuwe boekingen
- Klant registraties
- Voorraad wijzigingen
- Betalingen

**Voorraad status:**
- Lage voorraad waarschuwingen
- Kritieke items die aangevuld moeten worden
- Snelle links naar voorraad beheer`,
        features: [
          'Real-time data updates',
          'Vergelijking met vorige perioden',
          'Interactieve grafieken',
          'Snelle actieknoppen',
          'Mobile responsive design'
        ],
        tips: [
          'Bekijk je dashboard dagelijks om trends te spotteren',
          'Gebruik de datum filters om specifieke perioden te analyseren',
          'Let op voorraad waarschuwingen om out-of-stock te voorkomen'
        ]
      },
      {
        id: 'metrics-explanation',
        title: 'Metrics uitgelegd',
        content: `**Omzet berekeningen:**
- Totale omzet wordt berekend op basis van voltooide afspraken
- Verwachte omzet include geplande afspraken voor de rest van de maand
- Groei percentage vergelijkt huidige maand met vorige maand

**Klant metrics:**
- Nieuwe klanten: Eerste afspraak deze maand
- Terugkerende klanten: Klanten met meerdere afspraken
- Klant tevredenheid: Gebaseerd op reviews en herhalingen

**Operational metrics:**
- Bezettingsgraad: Percentage geboekte tijd vs beschikbare tijd
- Gemiddelde behandelingsduur: Hoe lang behandelingen daadwerkelijk duren
- No-show rate: Percentage gemiste afspraken

**Financiële KPIs:**
- Gemiddelde orderwarde per klant
- Omzet per vierkante meter (indien ingevuld)
- Operationele marge (omzet min kosten)`,
        tips: [
          'Monitor je no-show rate - een hoge rate kan duiden op problemen',
          'Vergelijk je metrics met industry benchmarks',
          'Gebruik trends om beslissingen te maken over prijzen en services'
        ]
      }
    ]
  },
  {
    id: 'appointments',
    title: 'Agenda & Afspraken',
    icon: Calendar,
    description: 'Beheer alle afspraken, planning en beschikbaarheid van je salon',
    subsections: [
      {
        id: 'calendar-views',
        title: 'Kalender weergaves',
        content: `**Beschikbare weergaves:**

**Dag weergave:**
- Gedetailleerd overzicht van één dag
- Tijdslots van 15 minuten
- Drag & drop functionaliteit
- Kleur-gecodeerde afspraken per medewerker

**Week weergave:**
- Overzicht van 7 dagen
- Alle medewerkers naast elkaar
- Snel inzicht in beschikbaarheid
- Ideaal voor planning

**Maand weergave:**
- Overzicht van volledige maand
- Bezettingsgraad per dag
- Planning op lange termijn
- Vakantiedagen en vrije dagen

**Lijst weergave:**
- Chronologische lijst van afspraken
- Zoek en filter opties
- Export mogelijkheden
- Bulk acties`,
        features: [
          'Real-time synchronisatie tussen medewerkers',
          'Kleur coding per service type',
          'Drag & drop afspraken verplaatsen',
          'Automatische conflict detectie',
          'Mobile optimized interface'
        ],
        shortcuts: [
          { key: 'D', action: 'Schakel naar dag weergave' },
          { key: 'W', action: 'Schakel naar week weergave' },
          { key: 'M', action: 'Schakel naar maand weergave' },
          { key: 'L', action: 'Schakel naar lijst weergave' },
          { key: 'N', action: 'Nieuwe afspraak' },
          { key: '←/→', action: 'Navigeer tussen dagen/weken' }
        ]
      },
      {
        id: 'booking-management',
        title: 'Afspraken beheer',
        content: `**Nieuwe afspraak maken:**
1. Klik op '+' knop of lege tijdslot
2. Selecteer klant (of maak nieuwe aan)
3. Kies service en medewerker
4. Bevestig tijd en datum
5. Voeg notities toe (optioneel)

**Afspraak wijzigen:**
- Sleep afspraak naar nieuwe tijd/datum
- Dubbelklik voor detail bewerking
- Wijzig service, duur of medewerker
- Stuur automatisch bevestiging naar klant

**Afspraak statussen:**
- **Gepland**: Normale geplande afspraak
- **Bevestigd**: Klant heeft bevestigd
- **Onderweg**: Klant is onderweg
- **Bezig**: Behandeling is gestart
- **Voltooid**: Behandeling afgerond
- **Geannuleerd**: Afspraak geannuleerd
- **No-show**: Klant niet verschenen

**Bulk acties:**
- Selecteer meerdere afspraken
- Wijzig status in bulk
- Verstuur groep berichten
- Export naar Excel/PDF`,
        features: [
          'Automatische bevestigingsemails',
          'SMS herinneringen (bij configuratie)',
          'Wachtlijst beheer',
          'Terugkerende afspraken',
          'Treatment series booking'
        ],
        troubleshooting: [
          {
            problem: 'Afspraak kan niet worden ingepland',
            solution: 'Controleer of medewerker beschikbaar is en openingstijden correct zijn ingesteld'
          },
          {
            problem: 'Klant ontvangt geen bevestiging',
            solution: 'Verificeer email instellingen in Admin → Instellingen → Email configuratie'
          },
          {
            problem: 'Dubbele boekingen',
            solution: 'Systeem detecteert automatisch conflicten - check of alle afspraken correct zijn opgeslagen'
          }
        ]
      },
      {
        id: 'staff-scheduling',
        title: 'Personeelsplanning',
        content: `**Medewerker schema\'s:**
- Stel individuele werkdagen en -tijden in
- Configureer pauzes en lunchpauzes
- Plan vakantiedagen en vrije dagen
- Stel overtime regels in

**Beschikbaarheid beheer:**
- Real-time beschikbaarheid tracking
- Automatische conflict detectie
- Flexibele dienst roosters
- Wisselende diensten ondersteuning

**Service toewijzingen:**
- Wijs services toe aan specifieke medewerkers
- Stel expertise niveaus in
- Configureer service duur per medewerker
- Beheer specialisaties

**Planning tools:**
- Auto-planning suggesties
- Workload balancing
- Optimale schema generatie
- Efficiency tracking`,
        tips: [
          'Update schema\'s tijdig om dubbele boekingen te voorkomen',
          'Gebruik kleur coding om verschillende medewerkers snel te herkennen',
          'Plan populaire time slots strategisch in'
        ]
      },
      {
        id: 'online-booking',
        title: 'Online boeking systeem',
        content: `**Voor klanten:**
Klanten kunnen 24/7 online afspraken boeken via jouw unieke booking link:
- **Subdomain**: jouwsalon.salonsphere.nl
- **Custom domain**: mogelijk via Admin instellingen

**Booking flow:**
1. Service selectie
2. Medewerker keuze (optioneel)
3. Beschikbare tijden
4. Klantgegevens invullen
5. Bevestiging en betaling (optioneel)

**Beschikbaarheid regels:**
- Minimale boekingstijd vooraf (bijv. 2 uur)
- Maximale boekingsperiode (bijv. 3 maanden vooruit)
- Blackout periods voor speciale gebeurtenissen
- Automatische buffers tussen afspraken

**Customization opties:**
- Aangepaste kleuren en branding
- Logo en salon foto\'s
- Aangepaste teksten en berichtgeving
- Service beschrijvingen en prijzen`,
        features: [
          'Responsive design voor alle devices',
          'Real-time beschikbaarheid',
          'Automatische bevestigingsemails',
          'Integratie met Google Calendar',
          'Sociale media integratie'
        ]
      }
    ]
  },
  {
    id: 'clients',
    title: 'Klantbeheer',
    icon: Users,
    description: 'Beheer al je klantinformatie, geschiedenis en communicatie op één plek',
    subsections: [
      {
        id: 'client-profiles',
        title: 'Klant profielen',
        content: `**Klant informatie:**
- Persoonlijke gegevens (naam, email, telefoon)
- Adres informatie voor thuis services
- Geboortedatum voor verjaardags marketing
- Notities en bijzonderheden
- Foto\'s (voor herkenning)

**Behandeling geschiedenis:**
- Volledige historie van alle afspraken
- Gebruikte producten per sessie
- Behandeling resultaten en notities
- Voor/na foto\'s
- Allergieën en contra-indicaties

**Communicatie tracking:**
- Email historie
- SMS berichten
- Marketing voorkeuren
- GDPR consent status
- Contact momenten log

**Financiële informatie:**
- Totaal besteed bedrag
- Gemiddelde order waarde
- Betalingsgedrag
- Openstaande facturen
- Loyalty punten`,
        features: [
          'Geavanceerde zoek functies',
          'Bulk import/export',
          'Duplicate detectie',
          'Automatische data enrichment',
          'Privacy compliance tools'
        ],
        tips: [
          'Vul notities in na elke behandeling voor persoonlijke service',
          'Upload foto\'s om klanten beter te herkennen',
          'Tag klanten voor gerichte marketing campaigns'
        ]
      },
      {
        id: 'client-segmentation',
        title: 'Klant segmentatie',
        content: `**Automatische segmentatie:**
- **VIP klanten**: Hoge bestedingen en frequentie
- **Nieuwe klanten**: Eerste 3 maanden
- **Actieve klanten**: Recent bezocht (laatste 3 maanden)
- **Inactieve klanten**: Langer dan 6 maanden geleden
- **At-risk klanten**: Dalende frequentie

**Custom tags:**
- Maak eigen labels voor specifieke groepen
- Filter klanten op basis van tags
- Gebruik tags voor gerichte marketing
- Automatische tag toewijzing mogelijk

**Gedragsanalyse:**
- Booking patronen
- Seizoensvoorkeuren
- Service voorkeuren
- Prijs gevoeligheid
- Cancellation gedrag

**Marketing doelgroepen:**
- Segment klanten voor email campaigns
- Personaliseerde aanbiedingen
- Verjaardags campaigns
- Win-back campaigns voor inactieve klanten`,
        features: [
          'Smart segmentation algoritmes',
          'Custom tag systeem',
          'Behavioral analytics',
          'Automated workflows',
          'Performance tracking'
        ]
      },
      {
        id: 'treatment-tracking',
        title: 'Behandeling tracking',
        content: `**Treatment series:**
- Plan meerdere sessies als pakket
- Automatische follow-up boekingen
- Voortgang tracking per sessie
- Aangepaste behandeling plannen

**Resultaat documentatie:**
- Voor/na foto\'s
- Behandeling notities
- Product gebruik registratie
- Klant feedback
- Bijwerkingen of reacties

**Progress monitoring:**
- Visuele voor/na vergelijkingen
- Meetbare resultaten tracking
- Behandeling effectiviteit
- Klant tevredenheid scores
- Aanbevelingen voor vervolgbehandelingen

**Compliance:**
- GDPR conforme opslag
- Consent management
- Data retention policies
- Export mogelijkheden voor klant`,
        tips: [
          'Maak foto\'s met goede verlichting voor beste resultaten',
          'Document alle bijzonderheden voor juridische bescherming',
          'Vraag klant feedback na elke sessie'
        ]
      }
    ]
  },
  {
    id: 'treatments',
    title: 'Behandelingen & Services',
    icon: Sparkles,
    description: 'Beheer al je services, prijzen, categorieën en treatment packages',
    subsections: [
      {
        id: 'service-management',
        title: 'Service beheer',
        content: `**Service configuratie:**
- Service naam en beschrijving
- Behandelingsduur (standaard en variaties)
- Prijs en BTW tarief
- Benodigde materialen
- Vereiste expertise niveau

**Categorieën:**
- Organiseer services in logische groepen
- Kleur coding voor snelle herkenning
- Hiërarchische structuur mogelijk
- Custom iconen per categorie

**Pricing strategieën:**
- Vaste prijzen
- Tijd-gebaseerde prijzen
- Pakket kortingen
- Seizoens prijzen
- Dynamic pricing (geavanceerd)

**Service variaties:**
- Verschillende duur opties
- Add-on services
- Upgrade mogelijkheden
- Combination deals`,
        features: [
          'Unlimited service types',
          'Flexible pricing models',
          'Category management',
          'Service bundling',
          'Seasonal adjustments'
        ],
        tips: [
          'Houd je prijzen up-to-date met markt tarieven',
          'Gebruik duidelijke beschrijvingen voor online booking',
          'Group gerelateerde services voor betere conversie'
        ]
      },
      {
        id: 'pricing-calculator',
        title: 'Prijs calculator',
        content: `**Overhead berekening:**
De pricing calculator helpt je realistische prijzen te bepalen door alle kosten mee te nemen:

**Directe kosten:**
- Product kosten per behandeling
- Tijd investering medewerker
- Equipment afschrijving
- Verbruiksartikelen

**Indirecte kosten (overhead):**
- Huur en utilities (% per behandeling)
- Marketing en advertising
- Administratie kosten
- Verzekeringen
- Software subscripties

**Winstmarge berekening:**
- Gewenste winstmarge percentage
- Markt positie (premium/budget)
- Concurrentie analyse
- Klant betalingsbereidheid

**Scenario modeling:**
- "What-if" analyses
- Volume discount scenario\'s
- Seizoens aanpassingen
- Market expansion modeling`,
        tips: [
          'Update overhead percentages maandelijks voor nauwkeurigheid',
          'Test verschillende prijs punten met A/B testing',
          'Monitor competitor pricing regelmatig'
        ]
      },
      {
        id: 'treatment-packages',
        title: 'Behandeling pakketten',
        content: `**Treatment series opzetten:**
Treatment series zijn krachtige tools voor klant retentie en omzet optimalisatie.

**Package types:**
- **Cure pakketten**: 6-12 sessies voor specifieke doelen
- **Maintenance programmas**: Reguliere onderhoud
- **Seasonal packages**: Zomer/winter specials
- **Bridal packages**: Trouwvoorbereiding

**Configuratie opties:**
- Aantal sessies per pakket
- Interval tussen sessies (bijv. 1 week)
- Totale pakket duur
- Korting vs losse behandelingen
- Flexibiliteit in planning

**Automatische planning:**
- Systeem plant alle sessies automatisch
- Klant krijgt overzicht van alle afspraken
- Herinneringen voor volgende sessie
- Voortgang tracking

**Pakket management:**
- Wijzig planning indien nodig
- Voeg extra sessies toe
- Pause/resume pakketten
- Refund/credit management`,
        features: [
          'Flexible session scheduling',
          'Automatic progress tracking',
          'Custom package creation',
          'Discount management',
          'Payment plan integration'
        ]
      },
      {
        id: 'staff-assignments',
        title: 'Personeel toewijzingen',
        content: `**Service expertise:**
- Wijs services toe aan gekwalificeerde medewerkers
- Stel expertise niveaus in (beginner/gevorderd/expert)
- Configureer service duur per medewerker
- Beheer specialisaties en certificaten

**Workload balancing:**
- Automatische verdeling van afspraken
- Gelijke workload distributie
- Rekening houden met voorkeuren
- Efficiency optimalisatie

**Training tracking:**
- Bijhouden van certificaten
- Training planning
- Skill development
- Performance monitoring

**Commission tracking:**
- Service-based commissies
- Automatic calculation
- Performance bonuses
- Goal tracking`,
        tips: [
          'Update skill levels regelmatig na training',
          'Gebruik expertise levels voor premium pricing',
          'Monitor performance metrics per medewerker'
        ]
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Voorraadbeheer',
    icon: Package,
    description: 'Beheer je volledige voorraad, van inkoop tot verkoop en automatische bijbestelling',
    subsections: [
      {
        id: 'product-management',
        title: 'Product beheer',
        content: `**Product informatie:**
- Product naam, merk en beschrijving
- SKU/barcode voor tracking
- Categorieën en tags
- Foto\'s en product sheets
- Leverancier informatie

**Voorraad tracking:**
- Huidige voorraad levels
- Minimum voorraad grenzen
- Automatische low-stock alerts
- Reorder points en quantities
- Lead times van leveranciers

**Kosten en prijzen:**
- Inkoop prijzen (excl. BTW)
- Verkoop prijzen (incl. BTW)
- Marge berekeningen
- Volume kortingen
- Seasonal pricing

**Product lifecycle:**
- Product introductie datum
- Populariteit tracking
- Slow-moving stock identificatie
- End-of-life management
- Vervanger product suggestions`,
        features: [
          'Barcode scanning support',
          'Bulk import/export',
          'Low stock notifications',
          'Automatic reordering',
          'Supplier integration'
        ],
        tips: [
          'Stel realistische minimum voorraad in om stockouts te voorkomen',
          'Gebruik foto\'s om producten snel te herkennen',
          'Monitor slow-moving stock voor optimale cash flow'
        ]
      },
      {
        id: 'stock-operations',
        title: 'Voorraad operaties',
        content: `**Stock adjustments:**
- Handmatige correcties
- Damage/loss registratie
- Theft reporting
- Count discrepancies
- Transfer tussen locaties

**Purchase orders:**
- Automatische PO generatie
- Leverancier communicatie
- Delivery tracking
- Quality control
- Invoice matching

**Stock movements:**
- Alle voorraad mutaties tracking
- Audit trail voor compliance
- Reason codes voor wijzigingen
- Batch/lot tracking
- Expiry date management

**Inventory reporting:**
- Stock value rapporten
- Turn-over analyses
- ABC analysis
- Dead stock reports
- Profit margin analysis`,
        features: [
          'Complete audit trail',
          'Automated stock alerts',
          'Supplier performance tracking',
          'Cost analysis tools',
          'Compliance reporting'
        ],
        troubleshooting: [
          {
            problem: 'Voorraad klopt niet met telling',
            solution: 'Voer stock adjustment uit en noteer reden voor discrepantie'
          },
          {
            problem: 'Product niet gevonden in systeem',
            solution: 'Check spelling, gebruik barcode scan of voeg nieuw product toe'
          },
          {
            problem: 'Leverancier levert niet op tijd',
            solution: 'Update lead times en overweeg backup leveranciers'
          }
        ]
      },
      {
        id: 'automated-reordering',
        title: 'Automatische bijbestelling',
        content: `**Smart reordering:**
Het systeem kan automatisch producten bijbestellen op basis van:
- Historisch verbruik
- Seizoens patronen
- Lead times
- Budget constraints
- Leverancier minimums

**Reorder triggers:**
- Voorraad onder minimum level
- Projected stockout datum
- Automatische schema gebaseerd
- Manual override mogelijk

**Order optimization:**
- Economic order quantity (EOQ)
- Volume discount opportunities
- Shipping cost optimization
- Multiple supplier coordination
- Budget allocation

**Approval workflows:**
- Manager approval voor grote orders
- Budget limit checking
- Automatic vs manual approval
- Emergency order procedures`,
        tips: [
          'Review automatische orders wekelijks',
          'Stel seizoens aanpassingen in voor accuracy',
          'Monitor supplier performance voor betrouwbaarheid'
        ]
      }
    ]
  },
  {
    id: 'email-automation',
    title: 'E-mail Automatisering',
    icon: Mail,
    description: 'Automatiseer je klantcommunicatie met slimme email workflows en templates',
    subsections: [
      {
        id: 'email-workflows',
        title: 'Email workflows',
        content: `**Automatische triggers:**

**Booking gerelateerd:**
- Booking bevestiging (direct na reservering)
- Herinnering 24 uur vooraf
- Thank you email na afspraak
- Follow-up na 1 week
- Review request na 2 weken

**Klant lifecycle:**
- Welkom email voor nieuwe klanten
- Verjaardags wensen
- Inactiviteit re-engagement
- Win-back campaigns
- Loyality program updates

**Marketing campaigns:**
- Seizoens promoties
- Nieuwe service aankondigingen
- Special events
- Referral programs
- Newsletter updates

**Transactioneel:**
- Factuur verzending
- Betaling bevestigingen
- Credit note notificaties
- Payment reminders
- Subscription renewals`,
        features: [
          'Drag & drop email builder',
          'A/B testing capabilities',
          'Personalization tokens',
          'Multi-language support',
          'Performance analytics'
        ],
        tips: [
          'Test alle emails grondig voordat je ze activeert',
          'Gebruik personalisatie voor hogere open rates',
          'Monitor unsubscribe rates om spam te voorkomen'
        ]
      },
      {
        id: 'email-templates',
        title: 'Email templates',
        content: `**Template types:**

**Booking templates:**
- Bevestiging: Professional bevestiging met alle details
- Herinnering: Vriendelijke reminder met salon info
- Reschedule: Makkelijke links om af te spraken te wijzigen
- Cancellation: Confirmation en reschedule opties

**Marketing templates:**
- Newsletter: Monthly/weekly updates
- Promotion: Special offers en discounts
- Announcement: Nieuwe services of wijzigingen
- Seasonal: Holiday en seizoens content

**Transactional templates:**
- Invoice: Professional factuur layout
- Receipt: Payment confirmation
- Welcome: Nieuwe klant onboarding
- Thank you: Post-treatment appreciation

**Template customization:**
- Salon branding en kleuren
- Logo en contact informatie
- Social media links
- Legal disclaimers
- Unsubscribe links

**Dynamic content:**
- Klant naam personalisatie
- Service specifieke content
- Location-based information
- Weather-based suggestions
- Personalized recommendations`,
        features: [
          'WYSIWYG email editor',
          'Mobile responsive designs',
          'Template library',
          'Brand consistency tools',
          'Legal compliance helpers'
        ]
      },
      {
        id: 'automation-rules',
        title: 'Automatisering regels',
        content: `**Trigger configuratie:**
- Tijd-gebaseerde triggers
- Event-gebaseerde triggers
- Gedrag-gebaseerde triggers
- Datum/seizoen triggers
- Custom conditional logic

**Audience targeting:**
- Segment selectie
- Demographic filters
- Behavioral criteria
- Purchase history
- Engagement level

**Frequency controls:**
- Maximum emails per week
- Cool-down periods
- Preference management
- Unsubscribe handling
- Bounce management

**Performance optimization:**
- Send time optimization
- Subject line testing
- Content performance
- Delivery rate monitoring
- Engagement tracking`,
        troubleshooting: [
          {
            problem: 'Emails komen aan in spam folder',
            solution: 'Verificeer SPF/DKIM records en vermijd spam trigger woorden'
          },
          {
            problem: 'Lage open rates',
            solution: 'Test verschillende subject lines en send times'
          },
          {
            problem: 'Hoge unsubscribe rate',
            solution: 'Reduceer frequency en verbeter content relevantie'
          }
        ]
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notificaties',
    icon: Bell,
    description: 'Beheer alle notificaties en waarschuwingen in je salon systeem',
    subsections: [
      {
        id: 'notification-types',
        title: 'Notificatie types',
        content: `**Systeem notificaties:**
- Nieuwe online boekingen
- Afspraak wijzigingen/annuleringen
- Payment confirmations
- System maintenance alerts
- Security warnings

**Operationele alerts:**
- Lage voorraad waarschuwingen
- Equipment maintenance reminders
- Staff schedule conflicts
- Overbooking warnings
- No-show notifications

**Business intelligence:**
- Daily/weekly performance summaries
- Goal achievement notifications
- Trend alerts (positive/negative)
- Competitor activity (indien geconfigureerd)
- Market opportunity alerts

**Custom notifications:**
- Client milestone alerts
- Anniversary reminders
- Follow-up task reminders
- Marketing campaign results
- Review/feedback requests`,
        features: [
          'Real-time push notifications',
          'Email digest options',
          'Mobile app notifications',
          'Desktop browser notifications',
          'SMS alerts (premium feature)'
        ]
      },
      {
        id: 'notification-settings',
        title: 'Notificatie instellingen',
        content: `**Delivery preferences:**
- Push notifications (real-time)
- Email notifications (digest)
- SMS notifications (urgent only)
- In-app notifications
- Desktop notifications

**Frequency settings:**
- Immediate (real-time)
- Hourly digest
- Daily summary
- Weekly report
- Custom schedule

**Priority levels:**
- Critical: Immediate attention required
- High: Important but not urgent
- Medium: Informational
- Low: Background information

**Channel customization:**
- Different channels per notification type
- Time-based routing
- Escalation procedures
- Quiet hours respect`,
        tips: [
          'Start conservatief met notificaties en voeg toe naar behoefte',
          'Gebruik quiet hours om buiten werktijd rust te hebben',
          'Test notification delivery om te zorgen dat ze aankomen'
        ]
      }
    ]
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    icon: Shield,
    description: 'Geavanceerde salon management en configuratie opties voor administrators',
    subsections: [
      {
        id: 'user-management',
        title: 'Gebruikers beheer',
        content: `**Staff management:**
- Medewerker accounts aanmaken
- Rol en permissie toewijzing
- Login credentials beheer
- Two-factor authentication setup
- Account deactivering

**Permission levels:**
- **Admin**: Volledige toegang tot alle functies
- **Manager**: Operationele toegang, beperkte admin functies
- **Staff**: Eigen agenda en klanten
- **Receptionist**: Booking en klant management
- **Viewer**: Alleen read access

**Access control:**
- Feature-based permissions
- Time-based access restrictions
- IP address restrictions
- Device management
- Session monitoring

**Audit trail:**
- User action logging
- Login/logout tracking
- Data modification history
- Permission changes
- Security events`,
        features: [
          'Role-based access control',
          'Single sign-on (SSO) ready',
          'Multi-factor authentication',
          'Session management',
          'Security monitoring'
        ],
        tips: [
          'Geef alleen noodzakelijke permissies aan medewerkers',
          'Review user access regelmatig',
          'Gebruik sterke wachtwoord policies'
        ]
      },
      {
        id: 'salon-settings',
        title: 'Salon instellingen',
        content: `**Bedrijfs configuratie:**
- Salon naam en branding
- Adres en contact informatie
- BTW nummer en KVK registratie
- Bank gegevens
- Verzekering informatie

**Operationele instellingen:**
- Openingstijden en sluitingsdagen
- Boekingsregels en restricties
- Cancellation policies
- Payment terms
- Service areas

**Technical configuratie:**
- Domain en subdomain setup
- SSL certificaat management
- Email server configuration
- API integrations
- Backup settings

**Compliance settings:**
- GDPR compliance tools
- Data retention policies
- Cookie consent management
- Privacy policy integration
- Terms of service`,
        features: [
          'White-label branding options',
          'Multi-location support',
          'Custom domain integration',
          'Advanced security settings',
          'Compliance automation'
        ]
      },
      {
        id: 'integrations',
        title: 'Integraties',
        content: `**Beschikbare integraties:**

**Calendar sync:**
- Google Calendar bidirectional sync
- Outlook Calendar integration
- Apple Calendar support
- Team calendar sharing
- External calendar blocking

**Payment providers:**
- Mollie (Nederlandse markt)
- Stripe (internationale markt)
- PayPal integration
- SEPA direct debit
- Cash register integration

**Marketing tools:**
- Mailchimp synchronization
- Facebook Pixel integration
- Google Analytics setup
- Social media auto-posting
- Review platform connections

**Business tools:**
- Accounting software (Exact Online, etc.)
- CRM integration
- Inventory suppliers
- Loyalty program platforms
- SMS service providers

**Custom integrations:**
- REST API access
- Webhook notifications
- Custom data exports
- Third-party app connections
- Enterprise SSO`,
        features: [
          'API-first architecture',
          'Real-time data sync',
          'Error handling & retry logic',
          'Rate limiting protection',
          'Integration monitoring'
        ],
        troubleshooting: [
          {
            problem: 'Google Calendar sync werkt niet',
            solution: 'Controleer OAuth permissions en herconnect indien nodig'
          },
          {
            problem: 'Payment integration fails',
            solution: 'Verificeer API keys en test credentials in sandbox mode'
          },
          {
            problem: 'Data sync is vertraagd',
            solution: 'Check network connectivity en API rate limits'
          }
        ]
      },
      {
        id: 'data-management',
        title: 'Data beheer',
        content: `**Data import/export:**
- Bulk client import van CSV/Excel
- Service data migration
- Historical booking data
- Inventory data transfers
- Financial transaction history

**Backup & recovery:**
- Automatische daily backups
- Point-in-time recovery
- Data consistency checks
- Disaster recovery procedures
- Data migration tools

**Data analytics:**
- Custom report generation
- Data warehouse integration
- Business intelligence tools
- Performance analytics
- Predictive modeling

**Compliance management:**
- GDPR right to be forgotten
- Data portability requests
- Consent management
- Privacy impact assessments
- Legal hold procedures`,
        features: [
          'Automated backup systems',
          'Data integrity monitoring',
          'Compliance automation',
          'Custom reporting tools',
          'Data visualization'
        ]
      }
    ]
  },
  {
    id: 'settings',
    title: 'Instellingen',
    icon: Settings,
    description: 'Configureer alle aspecten van je salon voor optimale werking',
    subsections: [
      {
        id: 'business-info',
        title: 'Bedrijfsinformatie',
        content: `**Basis informatie:**
- Salon naam en handelsnaam
- Adres en vestiging informatie
- Telefoon en email contact
- Website en social media
- KVK nummer en BTW nummer

**Branding:**
- Logo upload (verschillende formaten)
- Kleurenschema aanpassing
- Font selectie
- Brand guidelines
- Marketing materialen

**Legal informatie:**
- Terms of service
- Privacy policy
- Cookie policy
- Disclaimer texts
- License informatie

**Contact informatie:**
- Hoofdkantoor adres
- Facturatie adres
- Emergency contact
- Accountant gegevens
- Verzekering maatschappij`,
        tips: [
          'Houd je bedrijfsgegevens altijd up-to-date',
          'Upload een high-quality logo voor professionele uitstraling',
          'Controleer legal documents regelmatig op actualiteit'
        ]
      },
      {
        id: 'operating-hours',
        title: 'Openingstijden',
        content: `**Reguliere uren:**
- Dagelijkse openings- en sluitingstijden
- Lunchpauzes en breaks
- Verschillende uren per dag
- Seizoens aanpassingen
- Weekend uren

**Speciale dagen:**
- Feestdagen configuratie
- Vakantie periods
- Training dagen
- Maintenance dagen
- Special events

**Booking restrictions:**
- Minimum advance booking
- Maximum booking window
- Last-minute booking rules
- Same-day booking policies
- Block booking periods

**Staff schedules:**
- Individuele werktijden
- Part-time schedules
- Rotating shifts
- Overtime policies
- Availability exceptions`,
        features: [
          'Flexible scheduling rules',
          'Holiday calendar integration',
          'Automatic conflict detection',
          'Staff availability sync',
          'Customer notification system'
        ]
      },
      {
        id: 'booking-rules',
        title: 'Boekingsregels',
        content: `**Time restrictions:**
- Minimum tijd tussen boekingen
- Buffer time na behandelingen
- Cleanup time requirements
- Travel time tussen locaties
- Equipment setup time

**Customer restrictions:**
- Maximum gelijktijdige boekingen per klant
- Minimum leeftijd requirements
- Membership requirements
- Credit requirements
- Blacklist management

**Service restrictions:**
- Service-specific rules
- Staff expertise requirements
- Equipment availability
- Product requirements
- Season restrictions

**Cancellation policies:**
- Cancellation deadlines
- Penalty structures
- Reschedule policies
- No-show procedures
- Refund policies`,
        tips: [
          'Maak boekingsregels duidelijk voor klanten',
          'Stel realistische buffer tijden in',
          'Communiceer policies proactief'
        ]
      },
      {
        id: 'payment-settings',
        title: 'Betaal instellingen',
        content: `**Payment methods:**
- Cash betalingen
- Pin/debit cards
- Credit cards
- Online payments
- Mobile payments (Apple Pay, Google Pay)

**Payment providers:**
- Mollie configuratie
- Stripe setup
- PayPal integration
- Bank transfer options
- Cryptocurrency (advanced)

**Payment terms:**
- Prepayment requirements
- Deposit policies
- Payment deadlines
- Late payment fees
- Refund procedures

**Financial reporting:**
- Daily cash reconciliation
- Payment method analysis
- Transaction monitoring
- Chargeback management
- Tax reporting`,
        features: [
          'PCI compliance',
          'Fraud detection',
          'Automatic reconciliation',
          'Multi-currency support',
          'Payment analytics'
        ],
        troubleshooting: [
          {
            problem: 'Online betaling mislukt',
            solution: 'Check payment provider status en klant bank gegevens'
          },
          {
            problem: 'Reconciliation klopt niet',
            solution: 'Vergelijk cash register met system transactions'
          }
        ]
      }
    ]
  },
  {
    id: 'reporting',
    title: 'Rapportages & Analytics',
    icon: PieChart,
    description: 'Krijg diepgaand inzicht in je salon prestaties met uitgebreide rapportages',
    subsections: [
      {
        id: 'financial-reports',
        title: 'Financiële rapportages',
        content: `**Omzet rapporten:**
- Dagelijkse omzet tracking
- Maandelijse omzet overzichten
- Year-over-year vergelijkingen
- Service category breakdowns
- Staff performance omzet

**Kosten analyse:**
- Product kosten per behandeling
- Overhead cost allocation
- Staff cost analysis
- Marketing ROI
- Operational efficiency metrics

**Profit & loss:**
- Automatische P&L generatie
- Gross margin analysis
- Net profit tracking
- Cost center reporting
- Budget vs actual vergelijkingen

**Tax reporting:**
- BTW overzichten
- Quarterly tax reports
- Annual summaries
- Deductible expenses
- Accountant export formats`,
        features: [
          'Real-time financial dashboards',
          'Automated report generation',
          'Export to Excel/PDF',
          'Accountant-friendly formats',
          'Historical data analysis'
        ]
      },
      {
        id: 'operational-reports',
        title: 'Operationele rapporten',
        content: `**Appointment analytics:**
- Booking conversion rates
- No-show percentages
- Average appointment duration
- Peak hour analysis
- Seasonal booking patterns

**Staff performance:**
- Productivity metrics
- Service quality scores
- Customer satisfaction ratings
- Revenue per hour
- Efficiency indicators

**Customer analytics:**
- Customer lifetime value
- Retention rates
- Acquisition costs
- Referral tracking
- Satisfaction surveys

**Inventory reports:**
- Stock turnover rates
- Product profitability
- Waste and loss tracking
- Supplier performance
- Reorder recommendations`,
        tips: [
          'Review rapporten wekelijks voor trends',
          'Gebruik data voor strategische beslissingen',
          'Share key metrics met je team'
        ]
      }
    ]
  },
  {
    id: 'mobile-app',
    title: 'Mobile App & Responsive Design',
    icon: Smartphone,
    description: 'Gebruik SalonSphere onderweg met onze mobile-geoptimaliseerde interface',
    subsections: [
      {
        id: 'mobile-features',
        title: 'Mobile functionaliteiten',
        content: `**Core functies op mobile:**
- Volledige agenda toegang
- Client lookup en booking
- Quick appointment creation
- Status updates
- Payment processing

**Mobile-specific features:**
- Touch-optimized interface
- Swipe gestures
- Pull-to-refresh
- Offline mode (beperkt)
- Push notifications

**Staff mobile tools:**
- Personal agenda view
- Client check-in
- Treatment notes
- Photo documentation
- Quick messaging

**Owner mobile dashboard:**
- Real-time metrics
- Alert management
- Remote monitoring
- Quick approvals
- Emergency access`,
        tips: [
          'Pin de web app op je home screen voor app-like ervaring',
          'Gebruik landscape mode voor agenda views',
          'Enable push notifications voor real-time updates'
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Beveiliging & Privacy',
    icon: Lock,
    description: 'Leer over de beveiligingsmaatregelen en privacy features van SalonSphere',
    subsections: [
      {
        id: 'data-security',
        title: 'Data beveiliging',
        content: `**Encryption:**
- Data wordt encrypted in transit (TLS 1.3)
- Data at rest encryption (AES-256)
- Database level encryption
- Backup encryption
- End-to-end encryption voor gevoelige data

**Access controls:**
- Multi-factor authentication
- Role-based access control
- IP whitelisting mogelijk
- Session timeout policies
- Failed login protection

**Data isolation:**
- Tenant-level data segregation
- Row-level security policies
- API access controls
- Database isolation
- Backup isolation

**Compliance:**
- GDPR compliant data handling
- Right to be forgotten implementation
- Data portability tools
- Consent management
- Privacy by design architecture`,
        features: [
          'Enterprise-grade security',
          'Automatic security updates',
          'Vulnerability scanning',
          'Penetration testing',
          'Security monitoring'
        ]
      },
      {
        id: 'privacy-controls',
        title: 'Privacy controles',
        content: `**GDPR compliance:**
- Explicit consent collection
- Data minimization principles
- Purpose limitation
- Accuracy maintenance
- Storage limitation

**Customer rights:**
- Right to access personal data
- Right to rectification
- Right to erasure (right to be forgotten)
- Right to restrict processing
- Right to data portability

**Data processing:**
- Lawful basis documentation
- Processing activity records
- Data protection impact assessments
- Privacy by design implementation
- Data subject rights management

**Consent management:**
- Granular consent options
- Consent withdrawal mechanisms
- Consent history tracking
- Age verification for minors
- Cookie consent management`,
        tips: [
          'Review privacy policies jaarlijks',
          'Train staff in GDPR procedures',
          'Document all data processing activities'
        ]
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Probleemoplossing',
    icon: HelpCircle,
    description: 'Oplossingen voor veelvoorkomende problemen en technische issues',
    subsections: [
      {
        id: 'common-issues',
        title: 'Veelvoorkomende problemen',
        content: `**Login problemen:**
- Wachtwoord vergeten: Gebruik "Wachtwoord herstellen" link
- Account locked: Contact support voor unlock
- Two-factor issues: Check device time settings
- Browser compatibility: Gebruik moderne browser (Chrome, Firefox, Safari)

**Booking problemen:**
- Tijdslot niet beschikbaar: Check staff availability en openingstijden
- Dubbele bookings: System voorkomt dit automatisch
- Customer can\'t book online: Check public booking settings
- Confirmation emails not sending: Verify email configuration

**Performance issues:**
- Slow loading: Check internet connection en browser cache
- Page not responding: Refresh browser of log opnieuw in
- Mobile issues: Update browser of gebruik verschillende device
- Sync problems: Force refresh of contact support

**Data issues:**
- Missing appointments: Check filters en date range
- Incorrect customer data: Use edit function of contact support
- Report discrepancies: Verify date ranges en filters
- Export problems: Check file permissions en try different format`,
        troubleshooting: [
          {
            problem: 'Kan niet inloggen',
            solution: 'Clear browser cache, check wachtwoord, en probeer incognito mode'
          },
          {
            problem: 'Agenda laadt niet',
            solution: 'Refresh pagina, check internet verbinding, en clear browser data'
          },
          {
            problem: 'Emails worden niet verzonden',
            solution: 'Verificeer email server settings in Admin → Instellingen'
          },
          {
            problem: 'Mobile site werkt niet goed',
            solution: 'Update browser, clear cache, of gebruik desktop versie'
          }
        ]
      },
      {
        id: 'technical-support',
        title: 'Technische ondersteuning',
        content: `**Zelfhulp resources:**
- Deze help documentatie
- Video tutorials (indien beschikbaar)
- FAQ sectie
- Community forum
- Knowledge base

**Contact opties:**
- Support ticket systeem
- Email ondersteuning
- Telefoon support (business hours)
- Live chat (premium plans)
- Screen sharing sessions

**Support levels:**
- **Basic**: Email support binnen 48 uur
- **Professional**: Priority support binnen 24 uur
- **Enterprise**: Dedicated support manager

**Escalation procedures:**
- Level 1: General support team
- Level 2: Technical specialists
- Level 3: Development team
- Level 4: Management escalation`,
        tips: [
          'Probeer eerst zelfhulp opties voordat je contact opneemt',
          'Verzamel alle relevante informatie voordat je support belt',
          'Maak screenshots van error messages'
        ]
      }
    ]
  },
  {
    id: 'advanced-features',
    title: 'Geavanceerde Functies',
    icon: Target,
    description: 'Ontdek de krachtige geavanceerde functies voor professioneel salon management',
    subsections: [
      {
        id: 'treatment-series',
        title: 'Behandeling series & Trajecten',
        content: `**Treatment series systeem:**
SalonSphere biedt een geavanceerd systeem voor het beheren van behandeling trajecten en series.

**Wat zijn treatment series?**
- Meerdere behandelingen gepland als één traject
- Bijvoorbeeld: 8-weekse acne behandeling of 12-sessies laser ontharen
- Automatische planning van alle afspraken
- Voortgang tracking per sessie
- Klant kan volledige traject overzien

**Series configuratie:**
- Aantal sessies definiëren
- Interval tussen sessies (dagen/weken)
- Flexibiliteit in planning (strict/flexibel)
- Verschillende medewerkers mogelijk
- Service variaties per sessie

**Custom datums:**
- Handmatige planning van specifieke data
- Rekening houden met vakantieplannen
- Seizoens overwegingen
- Speciale events vermijden
- Client voorkeuren respecteren

**Voortgang monitoring:**
- Sessie completion tracking
- Resultaat documentatie per sessie
- Voor/na foto vergelijkingen
- Bijwerkingen en reacties
- Aanpassingen tijdens traject

**Payment integration:**
- Volledige betaling vooraf
- Installment betalingen
- Pay-per-session opties
- Refund bij vroege stop
- Insurance claim support`,
        features: [
          'Flexible serie planning',
          'Automated follow-up scheduling',
          'Progress photo galleries',
          'Client portal access',
          'Treatment outcome tracking',
          'Insurance integration ready'
        ],
        tips: [
          'Plan series met buffer tijd tussen sessies',
          'Documenteer elke sessie grondig voor beste resultaten',
          'Gebruik voor/na foto\'s om progress te tonen',
          'Communiceer duidelijk over total treatment duration'
        ]
      },
      {
        id: 'advanced-scheduling',
        title: 'Geavanceerde planning',
        content: `**Smart scheduling algorithms:**
Het systeem gebruikt intelligente algoritmes voor optimale planning:

**Conflict detection:**
- Real-time beschikbaarheid checking
- Overlapping appointment detection
- Travel time tussen locaties
- Equipment conflicts
- Staff double-booking prevention

**Optimization features:**
- Automatic gap filling
- Efficiency maximization
- Travel time minimization
- Client preference matching
- Revenue optimization

**Recurring appointments:**
- Weekly/monthly repeating slots
- Seasonal adjustments
- Holiday rescheduling
- Automatic renewal options
- Custom recurrence patterns

**Waitlist management:**
- Automatic rebooking from waitlist
- Priority customer handling
- Last-minute cancellation filling
- SMS notification for openings
- Revenue recovery optimization

**Advanced availability:**
- Multiple location support
- Room/equipment booking
- Specialist availability
- Training/meeting blocks
- Emergency appointment slots`,
        features: [
          'AI-powered scheduling suggestions',
          'Multi-resource booking',
          'Dynamic pricing integration',
          'Capacity optimization',
          'Real-time updates across devices'
        ]
      },
      {
        id: 'business-intelligence',
        title: 'Business Intelligence & Analytics',
        content: `**Advanced analytics dashboard:**
Krijg diepgaand inzicht in je salon performance met AI-powered analytics.

**Predictive analytics:**
- Revenue forecasting
- Customer churn prediction
- Demand forecasting
- Seasonal trend analysis
- Growth opportunity identification

**Customer insights:**
- Lifetime value calculation
- Behavioral segmentation
- Purchase pattern analysis
- Satisfaction prediction
- Referral likelihood scoring

**Operational analytics:**
- Resource utilization optimization
- Staff productivity analysis
- Service profitability ranking
- Inventory turnover optimization
- Cost center analysis

**Competitive intelligence:**
- Market position analysis
- Pricing optimization
- Service gap identification
- Trend adaptation recommendations
- Growth strategy insights

**Real-time dashboards:**
- Live performance monitoring
- Alert system for anomalies
- Key metric tracking
- Goal progress visualization
- Team performance comparison`,
        features: [
          'Machine learning algorithms',
          'Predictive modeling',
          'Custom KPI tracking',
          'Automated insights',
          'Executive reporting'
        ],
        tips: [
          'Review analytics wekelijks voor beste inzichten',
          'Set realistic goals gebaseerd op historical data',
          'Use predictive insights voor strategic planning'
        ]
      },
      {
        id: 'automation-workflows',
        title: 'Automatisering workflows',
        content: `**Workflow automation engine:**
Automatiseer repetitieve taken voor maximale efficiency.

**Booking workflows:**
- Auto-confirmation na online booking
- Reminder sequences (24h, 2h voor afspraak)
- Follow-up na behandeling
- Review request automation
- Rebooking suggestions

**Customer lifecycle automation:**
- Welcome serie voor nieuwe klanten
- Birthday campaigns
- Inactivity re-engagement
- Win-back sequences
- Loyalty program automation

**Business workflows:**
- Daily opening checklists
- Closing procedures
- Inventory reorder triggers
- Staff schedule notifications
- Financial reporting automation

**Marketing automation:**
- Seasonal campaign triggers
- Personalized offers
- Cross-sell/upsell sequences
- Referral program management
- Social media posting

**Integration workflows:**
- CRM synchronization
- Accounting system updates
- Calendar sync triggers
- Payment processing flows
- Report generation automation`,
        features: [
          'Visual workflow builder',
          'Conditional logic support',
          'Multi-channel execution',
          'Performance tracking',
          'A/B testing capabilities'
        ]
      }
    ]
  },
  {
    id: 'integrations-detailed',
    title: 'Integraties & Connectiviteit',
    icon: Globe,
    description: 'Verbind SalonSphere met al je bestaande tools en systemen',
    subsections: [
      {
        id: 'google-calendar',
        title: 'Google Calendar Integratie',
        content: `**Bidirectional sync:**
Volledige synchronisatie tussen SalonSphere en Google Calendar voor naadloze planning.

**Setup process:**
1. Ga naar Admin → Instellingen → Integraties
2. Klik op "Connect Google Calendar"
3. Autoriseer SalonSphere toegang
4. Selecteer calendar voor sync
5. Configureer sync settings

**Sync features:**
- Real-time appointment sync
- Automatic conflict detection
- Color coding per service type
- Staff calendar separation
- Block time synchronization

**Calendar management:**
- Multiple calendar support
- Team calendar sharing
- External calendar blocking
- Meeting room booking
- Resource calendar integration

**Privacy & security:**
- Oauth 2.0 secure connection
- Granular permission control
- Data encryption in transit
- Audit trail logging
- Easy disconnection option`,
        features: [
          'Two-way synchronization',
          'Real-time updates',
          'Conflict resolution',
          'Multiple account support',
          'Secure OAuth integration'
        ],
        troubleshooting: [
          {
            problem: 'Calendar sync stopt plotseling',
            solution: 'Check OAuth token expiry en re-authorize indien nodig'
          },
          {
            problem: 'Appointments verschijnen dubbel',
            solution: 'Disable duplicate sync en clean up existing duplicates'
          },
          {
            problem: 'Sync is langzaam',
            solution: 'Check API rate limits en reduce sync frequency'
          }
        ]
      },
      {
        id: 'mollie-integration',
        title: 'Mollie Payment Integration',
        content: `**Nederlandse payment provider:**
Mollie integratie voor Nederlandse en Europese betalingen.

**Supported payment methods:**
- iDEAL (Nederland)
- Bancontact (België)
- SOFORT (Duitsland)
- Credit/debit cards
- PayPal
- Apple Pay & Google Pay
- SEPA Direct Debit
- Klarna (buy now, pay later)

**Setup process:**
1. Registreer bij Mollie.com
2. Verkrijg API keys (test & live)
3. Configureer in Admin → Betalingen
4. Test payment flow
5. Go live na approval

**Features:**
- Automatic payment capture
- Refund processing
- Chargeback protection
- Multi-currency support
- Subscription billing
- Split payments

**Security:**
- PCI DSS compliant
- 3D Secure support
- Fraud detection
- Secure tokenization
- Encrypted transactions`,
        features: [
          'European payment methods',
          'Automatic reconciliation',
          'Fraud protection',
          'Mobile optimization',
          'Developer-friendly API'
        ]
      },
      {
        id: 'email-providers',
        title: 'Email Service Providers',
        content: `**Ondersteunde providers:**

**Resend (Aanbevolen):**
- Developer-vriendelijke API
- Excellent deliverability
- Real-time analytics
- Easy setup en configuration
- Competitive pricing

**SendGrid:**
- Enterprise-grade reliability
- Advanced analytics
- A/B testing tools
- Template management
- Global infrastructure

**Mailgun:**
- High-volume sending
- Email validation
- Detailed logging
- European data centers
- API-first approach

**Configuration:**
1. Choose email provider
2. Obtain API credentials
3. Configure in Admin → Email Settings
4. Verify domain settings (SPF/DKIM)
5. Test email delivery

**Email templates:**
- Booking confirmations
- Appointment reminders
- Marketing newsletters
- Transactional emails
- Custom templates

**Deliverability optimization:**
- Domain authentication
- Sender reputation management
- List hygiene practices
- Bounce handling
- Unsubscribe management`,
        tips: [
          'Start met test credentials voordat je live gaat',
          'Monitor email deliverability rates dagelijks',
          'Keep email lists clean voor beste reputation'
        ]
      }
    ]
  },
  {
    id: 'api-documentation',
    title: 'API & Developers',
    icon: Database,
    description: 'Technische documentatie voor developers en API integraties',
    subsections: [
      {
        id: 'api-overview',
        title: 'API Overzicht',
        content: `**SalonSphere API:**
De SalonSphere platform biedt een RESTful API voor custom integraties en third-party applicaties.

**Base URL:**
\`\`\`
https://api.salonsphere.nl/v1
\`\`\`

**Authentication:**
- Bearer token authentication
- OAuth 2.0 flow
- API key voor server-to-server
- Rate limiting: 1000 requests/hour

**Available endpoints:**
- \`/appointments\` - Appointment management
- \`/clients\` - Customer data
- \`/services\` - Service catalog
- \`/staff\` - Staff management
- \`/inventory\` - Inventory operations
- \`/payments\` - Payment processing
- \`/reports\` - Analytics data

**Response format:**
- JSON responses
- Consistent error formats
- Pagination support
- Field filtering
- Include/exclude options`,
        features: [
          'RESTful design principles',
          'Comprehensive error handling',
          'Real-time webhooks',
          'Batch operations support',
          'SDK libraries available'
        ]
      },
      {
        id: 'webhooks',
        title: 'Webhooks & Real-time',
        content: `**Webhook events:**
- \`appointment.created\` - Nieuwe afspraak gemaakt
- \`appointment.updated\` - Afspraak gewijzigd
- \`appointment.cancelled\` - Afspraak geannuleerd
- \`client.created\` - Nieuwe klant toegevoegd
- \`payment.completed\` - Betaling voltooid
- \`inventory.low_stock\` - Lage voorraad waarschuwing

**Real-time subscriptions:**
- WebSocket connections
- Server-sent events
- Real-time dashboard updates
- Live appointment changes
- Instant notifications

**Integration examples:**
\`\`\`javascript
// Webhook endpoint example
app.post('/webhook/salonsphere', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'appointment.created':
      // Handle new appointment
      break;
    case 'payment.completed':
      // Process payment
      break;
  }
  
  res.status(200).json({ received: true });
});
\`\`\``,
        features: [
          'Reliable delivery guarantees',
          'Automatic retry logic',
          'Event filtering options',
          'Security verification',
          'Delivery confirmation'
        ]
      }
    ]
  },
  {
    id: 'technical-architecture',
    title: 'Technische Architectuur',
    icon: Database,
    description: 'Gedetailleerde informatie over de onderliggende technologie en architectuur',
    subsections: [
      {
        id: 'tech-stack',
        title: 'Technology Stack',
        content: `**Frontend Technology:**
- **Next.js 15.3.3**: Modern React framework met App Router
- **React 18.3.1**: Component-based user interface
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query v5**: Server state management
- **Lucide Icons**: Consistent iconography

**Backend & Database:**
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Relational database
- **Row Level Security (RLS)**: Tenant data isolation
- **Real-time subscriptions**: Live data updates
- **Edge Functions**: Serverless function execution

**Development & Testing:**
- **Playwright**: End-to-end testing
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Git**: Version control
- **Docker**: Containerization

**Infrastructure:**
- **Vercel/Netlify**: Frontend hosting
- **Supabase Cloud**: Backend hosting
- **CDN**: Global content delivery
- **SSL/TLS**: Secure connections
- **Monitoring**: Performance tracking`,
        features: [
          'Modern, performant tech stack',
          'Scalable architecture',
          'Type-safe development',
          'Real-time capabilities',
          'Enterprise-grade security'
        ]
      },
      {
        id: 'multi-tenant-architecture',
        title: 'Multi-Tenant Architectuur',
        content: `**Tenant isolation:**
SalonSphere gebruikt een sophisticatged multi-tenant systeem voor complete data scheiding tussen salons.

**Data isolation levels:**
- **Database level**: Row Level Security (RLS) policies
- **Application level**: Tenant context in alle queries
- **API level**: Automatic tenant filtering
- **UI level**: Tenant-specific branding
- **Authentication level**: Tenant-scoped user sessions

**Tenant identification:**
- Subdomain routing (salon.salonsphere.nl)
- Custom domain support
- User metadata tenant_id
- Session-based tenant context
- Middleware tenant resolution

**Security implementation:**
- PostgreSQL RLS policies op alle tabellen
- Automatic tenant_id injection
- Cross-tenant data access prevention
- Audit logging per tenant
- Isolated backup systems

**Performance optimization:**
- Tenant-specific caching
- Database query optimization
- Index optimization per tenant
- Connection pooling
- Resource usage monitoring

**Scalability features:**
- Horizontal scaling ready
- Multi-region deployment
- Load balancing
- Auto-scaling capabilities
- Performance monitoring`,
        features: [
          'Complete data isolation',
          'Scalable architecture',
          'Custom domain support',
          'Enterprise security',
          'Performance optimized'
        ],
        tips: [
          'Tenant context wordt automatisch beheerd',
          'Custom domains vereisen DNS configuratie',
          'Monitor resource usage per tenant'
        ]
      },
      {
        id: 'real-time-features',
        title: 'Real-time Functionaliteit',
        content: `**Real-time synchronization:**
SalonSphere gebruikt Supabase Real-time voor instant updates across alle gebruikers.

**Real-time events:**
- **Appointment changes**: Live agenda updates
- **Booking notifications**: Instant new booking alerts
- **Inventory updates**: Stock changes in real-time
- **Staff status**: Availability changes
- **Payment confirmations**: Instant payment updates

**Implementation:**
- WebSocket connections
- Automatic reconnection
- Offline support
- Conflict resolution
- Error handling

**Performance:**
- Efficient data transfer
- Selective subscriptions
- Bandwidth optimization
- Battery efficiency
- Connection management

**User experience:**
- Instant visual feedback
- Collaborative editing
- Live status indicators
- Automatic updates
- Smooth interactions

**Technical details:**
- PostgreSQL LISTEN/NOTIFY
- WebSocket protocol
- JSON patch updates
- Optimistic UI updates
- Rollback mechanisms`,
        features: [
          'Sub-second latency',
          'Automatic conflict resolution',
          'Offline/online sync',
          'Battery efficient',
          'Cross-device synchronization'
        ]
      },
      {
        id: 'security-implementation',
        title: 'Security Implementatie',
        content: `**Authentication & Authorization:**
- **Supabase Auth**: Enterprise-grade authentication
- **JWT tokens**: Secure session management
- **Role-based access**: Granular permissions
- **Multi-factor authentication**: Enhanced security
- **Session management**: Automatic timeout

**Data protection:**
- **Encryption at rest**: AES-256 database encryption
- **Encryption in transit**: TLS 1.3 connections
- **API security**: Rate limiting en validation
- **Input sanitization**: XSS en injection prevention
- **CORS policies**: Cross-origin request control

**Privacy compliance:**
- **GDPR ready**: Built-in compliance tools
- **Data minimization**: Only collect necessary data
- **Consent management**: Granular consent tracking
- **Data portability**: Export tools available
- **Right to erasure**: Automatic data deletion

**Infrastructure security:**
- **Regular security updates**: Automatic patching
- **Vulnerability scanning**: Continuous monitoring
- **Penetration testing**: Regular security audits
- **Backup encryption**: Secure backup storage
- **Access logging**: Complete audit trails

**Compliance standards:**
- **SOC 2 Type II**: Security compliance
- **ISO 27001**: Information security management
- **GDPR**: European privacy regulation
- **CCPA**: California privacy compliance
- **HIPAA ready**: Healthcare data protection`,
        features: [
          'Enterprise-grade security',
          'Automatic compliance tools',
          'Continuous monitoring',
          'Regular security audits',
          'Privacy by design'
        ]
      }
    ]
  }
]

export function HelpContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set())

  const filteredSections = helpSections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.subsections.some(sub => 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const toggleSubsection = (subsectionId: string) => {
    const newExpanded = new Set(expandedSubsections)
    if (newExpanded.has(subsectionId)) {
      newExpanded.delete(subsectionId)
    } else {
      newExpanded.add(subsectionId)
    }
    setExpandedSubsections(newExpanded)
  }

  const scrollToSection = (sectionId: string) => {
    setSelectedSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">SalonSphere Hulp & Documentatie</h1>
        </div>
        <p className="text-lg text-gray-600 mb-6">
          Welkom bij de complete handleiding voor SalonSphere. Hier vind je alles wat je nodig hebt om je salon succesvol te beheren.
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek in documentatie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Inhoudsopgave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                      selectedSection === section.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-sm">{section.title}</span>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {filteredSections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.id} id={section.id} className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Icon className="w-6 h-6 text-blue-600" />
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} className="border-l-2 border-gray-200 pl-6">
                      <button
                        onClick={() => toggleSubsection(subsection.id)}
                        className="flex items-center gap-2 mb-4 hover:text-blue-600 transition-colors"
                      >
                        {expandedSubsections.has(subsection.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <h3 className="text-xl font-semibold">{subsection.title}</h3>
                      </button>

                      {expandedSubsections.has(subsection.id) && (
                        <div className="space-y-6">
                          {/* Main Content */}
                          <div className="prose prose-gray max-w-none">
                            {subsection.content.split('\n\n').map((paragraph, index) => {
                              if (paragraph.trim().startsWith('```')) {
                                return (
                                  <pre key={index} className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                                    <code>{paragraph.replace(/```\w*\n?/g, '').replace(/```$/, '')}</code>
                                  </pre>
                                )
                              }
                              
                              if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
                                return (
                                  <h4 key={index} className="font-semibold text-gray-900 mt-6 mb-2">
                                    {paragraph.replace(/\*\*/g, '')}
                                  </h4>
                                )
                              }
                              
                              return (
                                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                                  {paragraph.split('**').map((part, i) => 
                                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                  )}
                                </p>
                              )
                            })}
                          </div>

                          {/* Features */}
                          {subsection.features && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                Belangrijkste functies
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {subsection.features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    {feature}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tips */}
                          {subsection.tips && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                Pro tips
                              </h4>
                              <div className="space-y-2">
                                {subsection.tips.map((tip, index) => (
                                  <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-amber-800">{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Keyboard Shortcuts */}
                          {subsection.shortcuts && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-500" />
                                Sneltoetsen
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {subsection.shortcuts.map((shortcut, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">
                                      {shortcut.key}
                                    </kbd>
                                    <span className="text-sm text-gray-600">{shortcut.action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Troubleshooting */}
                          {subsection.troubleshooting && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                Probleemoplossing
                              </h4>
                              <div className="space-y-3">
                                {subsection.troubleshooting.map((item, index) => (
                                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                    <div className="font-medium text-red-800 mb-2">
                                      ❌ {item.problem}
                                    </div>
                                    <div className="text-sm text-red-700">
                                      ✅ {item.solution}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          {/* Contact & Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-green-600" />
                Contact & Ondersteuning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Hulp nodig?</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>📧 support@salonsphere.nl</div>
                    <div>📞 +31 (0)20 123 4567</div>
                    <div>🕒 Ma-Vr 9:00-17:00</div>
                    <div>💬 Live chat (premium accounts)</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Snelle links</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Video tutorials
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Download gebruikershandleiding
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Globe className="w-4 h-4 mr-2" />
                      Community forum
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-500">
                <div>SalonSphere versie 2.1.0</div>
                <div>Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</div>
                <div className="mt-2">
                  <Badge variant="outline">Documentatie versie 1.0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}