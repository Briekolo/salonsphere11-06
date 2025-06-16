# Database Setup Instructies

## Stap 1: Database Migration Uitvoeren

1. **Ga naar je Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/drwxswnfwctstgdorhdw
   - Log in met je account

2. **Open SQL Editor**
   - Klik op "SQL Editor" in de linker sidebar
   - Klik op "New Query"

3. **Voer de Migration uit**
   - Kopieer de VOLLEDIGE inhoud van `supabase/migrations/20250611103934_peaceful_valley.sql`
   - Plak dit in de SQL Editor
   - Klik op "Run" (groene play button)
   - ✅ Je zou moeten zien: "Success. No rows returned"

## Stap 2: Test Data Toevoegen

1. **Open een nieuwe query**
   - Klik opnieuw op "New Query" in de SQL Editor

2. **Voer de seed data uit**
   - Kopieer de VOLLEDIGE inhoud van `supabase/seed.sql`
   - Plak dit in de SQL Editor
   - Klik op "Run"
   - ✅ Je zou moeten zien: "Success. No rows returned"

## Stap 3: Verificatie

### Controleer of tabellen zijn aangemaakt:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Controleer test data:
```sql
-- Controleer tenants
SELECT * FROM tenants;

-- Controleer users
SELECT * FROM users;

-- Controleer clients
SELECT * FROM clients;

-- Controleer services
SELECT * FROM services;

-- Controleer inventory
SELECT * FROM inventory_items;

-- Controleer bookings
SELECT * FROM bookings;
```

## Stap 4: Authenticatie Configureren

1. **Ga naar Authentication Settings**
   - Klik op "Authentication" → "Settings"

2. **Configureer Site URL**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

3. **Email Templates (Optioneel)**
   - Pas de email templates aan naar je wensen
   - Zet "Confirm email" uit voor development (Settings → Email)

## Stap 5: Test de Verbinding

1. **Start de applicatie**
   ```bash
   npm run dev
   ```

2. **Open de browser**
   - Ga naar: http://localhost:3000
   - De applicatie zou moeten laden zonder errors

## Demo Accounts

Na het uitvoeren van de seed data heb je de volgende demo accounts:

### Staff Accounts:
- **Admin**: julia@salonsphere.nl (Julia Smit)
- **Staff**: emma@salonsphere.nl (Emma de Vries)
- **Staff**: sophie@salonsphere.nl (Sophie Janssen)

### Demo Klanten:
- Emma de Vries (VIP klant)
- Sophie Janssen (Reguliere klant)
- Thomas Bakker (Nieuwe klant)
- Lisa Visser (Premium klant)
- Anna van der Berg (Reguliere klant)

### Demo Data Bevat:
- ✅ 6 Behandelingen (Pedicure, Manicure, Gezichtsbehandelingen, etc.)
- ✅ 6 Voorraad items (met verschillende stock levels)
- ✅ 5 Afspraken (verschillende statussen)
- ✅ 2 Betalingen
- ✅ 3 Prijspresets
- ✅ 2 Email herinneringen
- ✅ 3 Leverancier bestellingen

## Troubleshooting

### Error: "relation does not exist"
- Zorg dat je eerst de migration hebt uitgevoerd
- Controleer of alle tabellen zijn aangemaakt

### Error: "permission denied"
- Controleer of RLS policies correct zijn ingesteld
- Zorg dat je bent ingelogd als authenticated user

### Error: "duplicate key value"
- Dit is normaal bij het opnieuw uitvoeren van seed data
- De `ON CONFLICT` clauses zorgen ervoor dat duplicaten worden genegeerd

### Geen data zichtbaar in applicatie
- Controleer of je bent ingelogd
- Controleer of de tenant_id correct is gekoppeld
- Controleer de browser console voor JavaScript errors

## Volgende Stappen

Na succesvolle setup kun je:
1. **Inloggen** met een van de demo accounts
2. **Data bekijken** in alle modules van de applicatie
3. **Nieuwe data toevoegen** via de UI
4. **Real-time updates** testen
5. **API calls** testen via de service layers

Voor productie gebruik:
- Verwijder of wijzig de demo data
- Stel sterke wachtwoorden in
- Configureer email providers
- Stel backup procedures in