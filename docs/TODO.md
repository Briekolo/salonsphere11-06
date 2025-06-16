# Salonsphere – Takenlijst (v1.0)

> Laatst bijgewerkt: <!-- CURSOR_WILL_FILL_DATE -->

Deze lijst bevat **alle** openstaande punten om versie 1.0 conform het PRD, beveiligings- en prestatie-eisen live te krijgen. Taken zijn gegroepeerd per domein en chronologisch geordend (grofweg 'must-have' → 'nice-to-have'). Alles is reeds in het Nederlands geformuleerd.

---

## 1. Core Setup & Auth

- [ ] **Auth-pagina's bouwen**  
  ‣ `/auth/sign-in`, `/auth/sign-up`, `/auth/reset` (magic-link + wachtwoord)  
  ‣ Formvalidatie met Zod, foutmeldingen in NL.
- [ ] **Onboarding-wizard voor nieuwe tenant**  
  ‣ Salon-gegevens, abonnementstier, uitnodigen personeel.  
  ‣ Na voltooien → `tenant_id` opslaan, redirect naar `/dashboard`.
- [ ] **AuthProvider integreren in _root_ layout**  
  ‣ Context al aanwezig (`components/auth/AuthProvider.tsx`), maar nog niet gebruikt.  
  ‣ Routebescherming + redirects op basis van `user` en `role`.
- [ ] **Role-based UI-gating**  
  ‣ `admin`, `staff`, `client` shields in middleware / component wrappers.  
  ‣ 403-pagina tonen bij ongeoorloofde toegang.

## 2. Dashboard (Home + Analytics)

- [ ] **Realtime key-metrics koppelen**  
  ‣ Vervang statische dummy-data in `MetricsCards`, `RevenueChart`, `AppointmentsList`, `PopularServices`, `InventoryStatus`.  
  ‣ Queries via Supabase-SDK / service-laag.
- [ ] **Charts implementeren (Recharts of Visx)**  
  ‣ Gebruikers-activiteit, omzet, conversie-trechter.  
  ‣ Resizable & themable.
- [ ] **Auto-refresh toggle in `AnalyticsDashboard` aansluiten**  
  ‣ Momenteel alleen timer; laad écht nieuwe data.

## 3. Behandelingen (Treatments)

- [ ] **Data ophalen & CRUD**  
  ‣ `lib/services/serviceService.ts` is klaar, maar UI -componenten (`TreatmentsList`, `TreatmentForm`, etc.) gebruiken nog hard-coded arrays.  
  ‣ Voeg SWR/React-Query of eigen hook toe voor cache & invalidatie.
- [ ] **Margin-calculator koppelen**  
  ‣ Waardes real-time bijwerken met invoer van materiaal- & arbeidskosten.

## 4. Inventaris

- [ ] **Voorraad-UI koppelen aan `inventoryService`**  
  ‣ Live stock, lage-voorraad alerts, voorraad-aanpassingen.
- [ ] **CSV import/export functionaliteit**  
  ‣ File upload + parsing (PapaParse)  
  ‣ Supabase bulk insert met `onConflict`.
- [ ] **Purchase Order flow**  
  ‣ `supplier_pos` & `supplier_po_items` screens + statussen (pending → delivered).

## 5. Afspraken (Agenda)

- [ ] **Kalender-component syncen**  
  ‣ Check conflicts, staff-availability, RLS-filters.  
  ‣ Google Calendar / iCal ICS export.
- [ ] **Realtime updates** bij nieuwe/gewijzigde afspraken (Supabase Realtime).

## 6. Klanten (CRM)

- [ ] **Clients-overzicht & detail**  
  ‣ Vervang dummy-gegevens door queries via `clientService`.  
  ‣ Tijdlijn (boekingen, betalingen, notities) renderen.
- [ ] **Segmentatie & zoekfunctie**  
  ‣ Gebruik `clientService.search()` & segment filters.

## 7. Marketing

- [ ] **Mailchimp OAuth-connectie** + token opslag.  
- [ ] **CampaignBuilder** afmaken → daadwerkelijk calls sturen naar Mailchimp API.
- [ ] **EmailTemplates & AutomationWorkflows** koppelen aan Supabase `email_reminders` table & Resend Edge Function.

## 8. Betalingen

- [ ] **Stripe card-betalingen**  
  ‣ Stripe SDK integreren (PaymentElement).  
  ‣ Success/webhook flow → `payments` tabel.
- [ ] **SEPA direct-debit**  
  ‣ Mandate form (IBAN + SEPA consent).  
  ‣ Edge Function `handle_stripe_webhook` schrijven.

## 9. Booking Portal (Public flow)

- [ ] **Publieke widget bouwen** (Next.js route zonder sidebar).  
  ‣ Behandeling kiezen, tijdslot, gegevens invullen, betalen, bevestiging.
- [ ] **Responsive embed** voor salonsites (iframe / script-tag).

## 10. Settings & Subscription

- [ ] **Instellingen-pagina**  
  ‣ Salonprofiel, abonnements-tier switch, Stripe billing history.  
  ‣ Staff-beheer (invites, rollen wijzigen, deactiveren).

## 11. Beveiliging & Prestatie

- [ ] **Database-linter warnings oplossen**  
  ‣ Indexen op foreign keys (`unindexed_foreign_keys`).  
  ‣ `auth_rls_initplan` optimaliseren door `select auth.*()` wrapper.  
  ‣ `function_search_path_mutable` voor `update_updated_at_column`.
- [ ] **CSP + overige security headers** in `next.config.js` productiebuild.  
- [ ] **MFA voor admin-accounts** (optioneel in v1.0, zie `security.md`).

## 12. Edge Functions

- [ ] **Resend email-sender** (`send_email_reminder`).  
- [ ] **Stripe webhook handler** (`process_stripe_webhook`).  
- [ ] **Cron-based stock alert** (lage voorraad → mail).

## 13. Testen & CI/CD

- [ ] **Jest + React Testing Library** voor componenten.  
- [ ] **RLS-integration tests** via Supabase CLI (`supabase test`).  
- [ ] **GitHub Actions**: lint, test, `supabase db push`, Vercel deploy.

## 14. Documentatie

- [ ] **README updaten** met lokale setup, env vars, Supabase CLI scripts.  
- [ ] API-docs (OpenAPI) voor publieke booking endpoints.

---

### ✅ Reeds afgerond (basis)

1. **Visual design & layout**  
   ‣ Sidebar, TopBar, theming, NL-locale.
2. **Frontend skeleton voor alle modules**  
   ‣ Pagina-routes in `app/` + inhoudscomponenten.
3. **Supabase-client & type-generatie** (`lib/supabase.ts`, `types/database.ts`).
4. **Service-laag voor kern­tabellen** (`clientService`, `serviceService`, `inventoryService`, `bookingService`).
5. **Demo-data & migrations** (zie `DATABASE_SETUP.md`).

> Zodra bovenstaande openstaande items geprioriteerd en toegewezen zijn, kan het developmentteam in sprints starten. 