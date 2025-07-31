# Plan: Integratie Staff Beschikbaarheid in Admin en Client Modules

## Huidige Status Analyse

### ✅ Wat er al geïmplementeerd is:
1. **Staff beschikbaarheid beheer** - Medewerkers kunnen hun eigen werkschema beheren
2. **Database structuur** - `staff_schedules` en `schedule_exceptions` tabellen
3. **AvailabilityService** - Bevat al `getStaffAvailability()` en checkt staff_schedules
4. **Client booking** - Controleert al op staff beschikbaarheid bij het tonen van tijdslots

### ❌ Wat ontbreekt:
1. **Admin overzicht** - Admin kan staff beschikbaarheid niet inzien
2. **Visuele indicatie** - Geen duidelijke weergave in agenda's wanneer staff niet beschikbaar is
3. **Bulk beheer** - Admin kan niet staff beschikbaarheid aanpassen
4. **Uitzonderingen UI** - Interface voor vakantie/ziekte meldingen

## Implementatie Plan

### 1. Admin Staff Management Uitbreiding ✅ COMPLETED
**Bestand:** `/app/admin/staff/page.tsx`
- ✅ Voeg "Beschikbaarheid" kolom toe aan staff overzicht
- ✅ Toon werkdagen per week (bijv. "Ma-Vr")
- ✅ Voeg actie knop toe: "Bekijk Schema"

### 2. Admin Staff Beschikbaarheid Detail Pagina ✅ FINISHED
**Nieuw bestand:** `/app/admin/staff/[id]/availability/page.tsx`
- ✅ Toon weekschema van specifieke medewerker
- ✅ Mogelijkheid voor admin om schema aan te passen
- ✅ Schema overzicht met statistieken (totaal uren, werkdagen, etc.)
- ✅ Staff informatie bovenaan pagina
- 🔄 Overzicht van uitzonderingen (vakantie/ziekte) - UI placeholder toegevoegd
- ❌ Geschiedenis van wijzigingen - nog niet geïmplementeerd

### 3. Admin Agenda Integratie ✅ COMPLETED
**Bestand:** `/components/agenda/KiboCalendarView.tsx`
- ✅ Visuele indicatie wanneer staff niet beschikbaar is:
  - ✅ Rode/amber/groene indicators voor beschikbaarheid status
  - ✅ Gekleurde achtergronden voor niet-beschikbare dagen
  - ✅ Tooltips met beschikbaarheid status
- ✅ Filter optie: "Toon alleen beschikbare tijden"
- ✅ Staff availability integratie in zowel maand als week view
- ❌ Rode blokken voor uitzonderingen - nog niet geïmplementeerd (requires exceptions functionality)

### 4. Client Booking Verbeteringen 📋 TODO
**Bestand:** `/app/(client)/[domain]/book/[serviceId]/time/page.tsx`
- Dagen zonder beschikbare staff grijs maken in kalender
- Duidelijke melding: "Geen medewerkers beschikbaar op deze dag"
- Bij staff selectie: toon alleen dagen waarop die staff werkt

### 5. Dashboard Widgets 📋 TODO
**Admin Dashboard** (`/app/admin/page.tsx`):
- Widget: "Medewerkers vandaag aanwezig"
- Widget: "Aankomende afwezigheden"
- Alert bij onderbezetting

**Staff Dashboard** (`/app/staff/dashboard/page.tsx`):
- Link naar beschikbaarheid beheer
- Reminder voor vakantie aanvragen

### 6. Notificatie Systeem 📋 TODO
- Email naar admin bij nieuwe vakantie aanvraag
- Waarschuwing bij conflicten (teveel staff afwezig)
- Reminder voor staff om beschikbaarheid up-to-date te houden

### 7. Reporting 📋 TODO
**Nieuw:** `/app/admin/reports/availability`
- Overzicht bezetting per maand
- Vakantie/ziekte statistieken
- Voorspelling onderbezetting

## Technische Aanpassingen

### Database
- Geen nieuwe tabellen nodig (gebruik bestaande)
- Mogelijk: audit log voor wijzigingen

### API/Services
- Uitbreiden `AvailabilityService`:
  - `getStaffAvailabilityForMonth()`
  - `getScheduleConflicts()`
  - `bulkUpdateSchedules()`

### UI Components
- `StaffAvailabilityCalendar` - Maandoverzicht component
- `StaffScheduleEditor` - Voor admin om schedules aan te passen
- `AvailabilityIndicator` - Badge/status component

### Permissions
- Admin: volledig beheer alle schedules
- Staff: alleen eigen schedule
- Client: alleen lezen (via booking interface)

## Prioritering
1. **Hoog:** Admin overzicht + detail pagina
2. **Hoog:** Visuele indicatie in agenda's
3. **Medium:** Client booking verbeteringen
4. **Medium:** Dashboard widgets
5. **Laag:** Reporting en analytics

## Geschatte Effort
- Admin views: 4-6 uur
- Agenda integratie: 3-4 uur
- Client verbetering: 2-3 uur
- Dashboard/Notificaties: 2-3 uur
- **Totaal: 11-16 uur**

## Status Log
- **2025-01-31**: Plan opgesteld
- **2025-01-31**: Start implementatie stap 1 - Admin Staff Management uitbreiding
- **2025-01-31**: ✅ Stap 1 voltooid - Admin staff overzicht toont nu beschikbaarheid en heeft "Bekijk Schema" actie
- **2025-01-31**: ✅ Stap 2 voltooid - Admin detail pagina voor staff beschikbaarheid met edit functionaliteit
- **2025-01-31**: ✅ Stap 3 voltooid - Admin agenda toont nu staff beschikbaarheid met visuele indicaties en filter