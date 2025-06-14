# Salonsphere – Development Progress Tracker

> Dit bestand houdt de voortgang bij van de implementatiestappen richting v1.0. Vink items af zodra ze volledig gerealiseerd en getest zijn.

## Legenda
- [ ] = Nog te doen
- [x] = Afgerond

---

## 1. Fundering
- [x] React Query (TanStack) provider toegevoegd in `RootLayout`
- [x] `useTenant` helper gemaakt voor snelle tenant-id toegang
- [x] Supabase types (`types/database.ts`) gegenereerd & up-to-date
- [x] Database-uitbreiding voor behandeltrajecten (`klant_behandeling_trajecten`, trigger)

## 2. Service-laag (Supabase queries)
- [x] `serviceService` – CRUD + listServices per tenant
- [x] `clientService` – CRUD + search
- [x] `clientService` - `getTreatmentProgress` toegevoegd
- [x] `inventoryService` – CRUD + lowStock filter
- [x] `bookingService` – CRUD + dateRange filter

## 3. React Query Hooks
- [x] `useServices`
- [x] `useClients`
- [x] `useClientById` toegevoegd
- [x] `useTreatmentProgress` toegevoegd
- [x] `useInventoryItems`
- [x] `useBookings`

## 4. Dashboard (Home)
- [x] SQL View/RPC `tenant_metrics`
- [x] `useKeyMetrics` hook + cards
- [x] Charts met echte data (Omzet, Activiteit, Conversies)

## 5. Treatments Module
- [x] Treatments-list gekoppeld aan `useServices`
- [x] TreatmentForm save/update via mutation
- [x] Margin Calculator live updates
- [ ] `TreatmentForm.tsx` - Input voor `aantal_sessies` toevoegen (UI-layout bug)

## 6. Inventory Module
- [x] Inventory list + CRUD
- [x] Low-stock banner
- [x] CSV import/export flow

## 7. Bookings / Calendar
- [x] `useBookings` + realtime channel
- [x] Booking modal create/update
- [x] Kalenderweergave: dag / week / maand met virtuele scroll
- [x] Drag-&-drop & resize om afspraken te verplaatsen / duur te wijzigen
- [ ] Filteren op medewerker, service & status
- [x] Kleuren per status (ingepland, bevestigd, voltooid, geannuleerd)
- [ ] Recurring / terugkerende afspraken support
- [ ] Wachtrij & overbooking-waarschuwingen
- [ ] Quick-create vanuit lege slot + inline client-zoeker
- [ ] E-mail & SMS herinneringen (Supabase functions + cron)
- [ ] Betaallink koppelen aan afspraak (Stripe)
- [ ] Bulk-update & bulk-delete acties
- [ ] CSV export van agenda per periode
- [ ] Print-/PDF-agenda per dag
- [ ] Realtime synchronisatie tussen meerdere schermen
- [ ] Unit tests voor bookingService & hooks (bookings)

## 8. CRM Clients
- [ ] Clients list – paginatie / infinite scroll & kolom-sorting
- [ ] Bulk-select + bulk-acties (segment toewijzen, export, verwijderen)
- [ ] CSV export / import flow
- [x] Quick Stats (totaal, nieuwe 30d, actief 90d, afspraken week) – Supabase queries
- [ ] Zoek- en filtercomponent verbinden met `useClients` (status, segment, periode)
- [ ] Segmenten aanmaken & opslaan per gebruiker
- [ ] ClientForm modal – create / update + validatie
- [x] ClientProfile – Supabase data i.p.v. mock
- [ ] ClientProfile - "Trajecten" tab met voortgangsbalken (UI-bugs)
- [ ] ClientProfile – details bewerken & tags beheren
- [ ] Timeline tab – afgelopen & geplande afspraken uit `bookings`
- [ ] Communications tab – e-mail/telefoon/SMS logging + verzendmodal
- [ ] Documents tab – uploads (Supabase Storage) & downloads
- [ ] Client verwijderen + bevestigingsdialoog
- [ ] Realtime updates (Supabase channel) op clients-list
- [ ] Unit tests voor service-laag & hooks (clients)

## 9. Marketing & Payments
- [ ] Mailchimp OAuth connect
- [ ] CampaignBuilder API calls
- [ ] Stripe card payments flow
- [ ] SEPA direct-debit flow

## 10. Security & Performance
- [ ] Supabase Advisor warnings oplossen
- [ ] CSP headers in `next.config.js`
- [ ] Pagination/infinite scroll op grote lijsten

## 11. Tests & CI/CD
- [ ] Unit & integration tests (Jest, Supabase CLI)
- [ ] GitHub Actions pipeline (lint, test, deploy)

---

### Laatst bijgewerkt: 14-06-2025