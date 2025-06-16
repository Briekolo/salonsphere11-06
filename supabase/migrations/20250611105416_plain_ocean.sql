-- Test data voor SalonSphere
-- Run dit script NADAT je de migration hebt uitgevoerd

-- 1. Demo Tenant (Salon)
INSERT INTO tenants (id, name, email, phone, address, subscription_tier, subscription_status) 
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'SalonSphere Demo',
  'demo@salonsphere.nl',
  '+31 20 123 4567',
  'Hoofdstraat 123, 1234 AB Amsterdam',
  'pro',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 2. Demo Users
INSERT INTO users (id, tenant_id, email, role, first_name, last_name, phone, active) VALUES
(
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'julia@salonsphere.nl',
  'admin',
  'Julia',
  'Smit',
  '+31 6 12345678',
  true
),
(
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'emma@salonsphere.nl',
  'staff',
  'Emma',
  'de Vries',
  '+31 6 87654321',
  true
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'sophie@salonsphere.nl',
  'staff',
  'Sophie',
  'Janssen',
  '+31 6 11223344',
  true
) ON CONFLICT (email) DO NOTHING;

-- 3. Demo Clients
INSERT INTO clients (tenant_id, email, first_name, last_name, phone, date_of_birth, address, marketing_consent, notes, tags, total_spent, last_visit_date) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'emma.client@example.com',
  'Emma',
  'de Vries',
  '+31 6 12345678',
  '1985-03-15',
  'Keizersgracht 456, 1017 EG Amsterdam',
  true,
  'Allergisch voor lavendel. Prefereert afspraken in de ochtend.',
  ARRAY['VIP', 'Regulier', 'Allergieën'],
  1250.00,
  '2024-01-15 10:30:00+01'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'sophie.client@example.com',
  'Sophie',
  'Janssen',
  '+31 6 87654321',
  '1990-07-22',
  'Prinsengracht 789, 1015 JS Amsterdam',
  true,
  'Komt graag voor manicures.',
  ARRAY['Regulier'],
  680.00,
  '2024-01-12 14:00:00+01'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'thomas.client@example.com',
  'Thomas',
  'Bakker',
  '+31 6 11223344',
  '1988-11-08',
  'Herengracht 321, 1016 BG Amsterdam',
  false,
  'Eerste bezoek, allergisch voor lavendel.',
  ARRAY['Nieuw'],
  85.00,
  '2024-01-10 16:00:00+01'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'lisa.client@example.com',
  'Lisa',
  'Visser',
  '+31 6 99887766',
  '1992-05-18',
  'Jordaan 654, 1016 DZ Amsterdam',
  true,
  'VIP klant, komt voor premium behandelingen.',
  ARRAY['Premium', 'VIP'],
  920.00,
  '2024-01-08 11:30:00+01'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'anna.client@example.com',
  'Anna',
  'van der Berg',
  '+31 6 55443322',
  '1987-12-03',
  'Vondelpark 987, 1071 AA Amsterdam',
  true,
  'Komt regelmatig voor gezichtsbehandelingen.',
  ARRAY['Regulier', 'Gezicht'],
  450.00,
  '2024-01-05 13:15:00+01'
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- 4. Demo Services
INSERT INTO services (tenant_id, name, description, category, duration_minutes, price, material_cost, active, preparation_info, aftercare_info) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Klassieke Pedicure',
  'Complete voetbehandeling inclusief nagelverzorging, eeltverwijdering en ontspannende voetmassage.',
  'Nagelverzorging',
  45,
  65.00,
  12.00,
  true,
  'Zorg voor schone voeten, vermijd crème 24u voor behandeling',
  'Houd voeten droog eerste 2 uur, gebruik aanbevolen voetcrème'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Luxe Manicure',
  'Professionele handverzorging met nagelbehandeling, cuticle care en handmassage voor perfecte handen.',
  'Nagelverzorging',
  60,
  55.00,
  8.00,
  true,
  'Verwijder oude nagellak, vermijd handcrème dag van behandeling',
  'Draag handschoenen bij huishoudelijk werk, gebruik cuticle oil dagelijks'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Anti-Aging Gezichtsbehandeling',
  'Intensieve behandeling tegen veroudering met peptiden en hyaluronzuur voor een stralende, jeugdige huid.',
  'Gezichtsbehandelingen',
  90,
  125.00,
  25.00,
  true,
  'Geen retinol 48u voor behandeling, kom onopgemaakt',
  'Gebruik SPF 30+, vermijd direct zonlicht 24u'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Ontspanningsmassage',
  'Volledige lichaamsmassage voor diepe ontspanning en stressvermindering met aromatherapie oliën.',
  'Massage',
  75,
  95.00,
  15.00,
  true,
  'Eet niet zwaar 2u voor massage, draag comfortabele kleding',
  'Drink veel water, rust 30 minuten na behandeling'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Brazilian Wax',
  'Professionele ontharing van het intieme gebied met hoogwaardige wax voor langdurig gladde huid.',
  'Ontharing',
  30,
  45.00,
  6.00,
  true,
  'Haar moet 5mm lang zijn, exfolieer 24u van tevoren',
  'Vermijd hete douches 24u, gebruik kalmerende lotion'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Hydraterende Gezichtsbehandeling',
  'Intensieve hydratatie voor droge huid met hyaluronzuur masker en vochtinbrengende serums.',
  'Gezichtsbehandelingen',
  60,
  75.00,
  18.00,
  true,
  'Kom onopgemaakt, vermijd scrubs 48u voor behandeling',
  'Gebruik aanbevolen serums, drink veel water'
) ON CONFLICT DO NOTHING;

-- 5. Demo Inventory Items
INSERT INTO inventory_items (tenant_id, name, description, sku, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier, location) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'OPI Base Coat',
  'Professionele base coat voor langdurige nagellak',
  'OPI-BC-001',
  'Nagelverzorging',
  8,
  5,
  20,
  'stuks',
  12.50,
  'OPI Professional',
  'Rek A1'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Essie Nagellak Rood',
  'Hoogwaardige nagellak in klassiek rood',
  'ESS-NL-RED',
  'Nagelverzorging',
  2,
  5,
  15,
  'stuks',
  8.95,
  'Essie',
  'Rek A2'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'CND Top Coat',
  'Beschermende top coat voor glanzende afwerking',
  'CND-TC-001',
  'Nagelverzorging',
  0,
  3,
  12,
  'stuks',
  15.75,
  'CND',
  'Rek A1'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Dermalogica Cleanser',
  'Diepreinigend gezichtsreiniger voor alle huidtypes',
  'DER-CL-250',
  'Huidverzorging',
  12,
  8,
  25,
  'stuks',
  28.50,
  'Dermalogica',
  'Rek B1'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Wegwerp Handdoeken',
  'Hygiënische wegwerp handdoeken voor behandelingen',
  'HYG-HD-100',
  'Verbruiksartikelen',
  1,
  10,
  50,
  'pakken',
  4.25,
  'Hygiene Plus',
  'Opslag C'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Massage Olie Lavendel',
  'Ontspannende massage olie met lavendel geur',
  'AA-MO-LAV',
  'Massage',
  6,
  4,
  15,
  'flessen',
  18.90,
  'Aromatherapy Associates',
  'Rek D2'
) ON CONFLICT (tenant_id, sku) DO NOTHING;

-- 6. Demo Bookings (Afspraken)
INSERT INTO bookings (tenant_id, client_id, service_id, staff_id, scheduled_at, duration_minutes, status, notes) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM clients WHERE email = 'emma.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM services WHERE name = 'Klassieke Pedicure' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2024-01-20 09:30:00+01',
  45,
  'confirmed',
  'Klant heeft allergie voor lavendel'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM clients WHERE email = 'sophie.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM services WHERE name = 'Luxe Manicure' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2024-01-20 11:00:00+01',
  60,
  'confirmed',
  'Reguliere klant'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM clients WHERE email = 'thomas.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM services WHERE name = 'Ontspanningsmassage' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2024-01-20 13:15:00+01',
  75,
  'scheduled',
  'Eerste bezoek'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM clients WHERE email = 'lisa.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM services WHERE name = 'Anti-Aging Gezichtsbehandeling' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2024-01-20 15:30:00+01',
  90,
  'confirmed',
  'VIP klant - premium behandeling'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM clients WHERE email = 'anna.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM services WHERE name = 'Hydraterende Gezichtsbehandeling' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2024-01-21 10:00:00+01',
  60,
  'scheduled',
  'Reguliere gezichtsbehandeling'
) ON CONFLICT DO NOTHING;

-- 7. Demo Payments
INSERT INTO payments (tenant_id, booking_id, client_id, amount, payment_method, status, payment_date, notes) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM bookings WHERE scheduled_at = '2024-01-20 09:30:00+01' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM clients WHERE email = 'emma.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  65.00,
  'card',
  'completed',
  '2024-01-20 09:30:00+01',
  'Betaling via PIN'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM bookings WHERE scheduled_at = '2024-01-20 11:00:00+01' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM clients WHERE email = 'sophie.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  55.00,
  'sepa',
  'completed',
  '2024-01-20 11:00:00+01',
  'Automatische incasso'
) ON CONFLICT DO NOTHING;

-- 8. Demo Pricing Presets
INSERT INTO pricing_presets (tenant_id, name, description, labor_rate_per_hour, overhead_percentage, target_margin_percentage, is_default) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Standaard Prijsstelling',
  'Standaard prijscalculatie voor reguliere behandelingen',
  45.00,
  25.00,
  75.00,
  true
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Premium Prijsstelling',
  'Hogere prijsstelling voor premium behandelingen',
  65.00,
  30.00,
  80.00,
  false
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Budget Prijsstelling',
  'Lagere prijsstelling voor basis behandelingen',
  35.00,
  20.00,
  70.00,
  false
) ON CONFLICT (tenant_id, name) DO NOTHING;

-- 9. Demo Email Reminders
INSERT INTO email_reminders (tenant_id, booking_id, client_id, reminder_type, scheduled_at, status, email_subject, email_body) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM bookings WHERE scheduled_at = '2024-01-20 09:30:00+01' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM clients WHERE email = 'emma.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'confirmation',
  '2024-01-19 09:30:00+01',
  'sent',
  'Bevestiging van uw afspraak bij SalonSphere',
  'Beste Emma, uw afspraak voor een Klassieke Pedicure is bevestigd voor morgen om 09:30.'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM bookings WHERE scheduled_at = '2024-01-20 11:00:00+01' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  (SELECT id FROM clients WHERE email = 'sophie.client@example.com' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'reminder_24h',
  '2024-01-19 11:00:00+01',
  'scheduled',
  'Herinnering: Uw afspraak morgen bij SalonSphere',
  'Beste Sophie, dit is een herinnering voor uw afspraak morgen om 11:00 voor een Luxe Manicure.'
) ON CONFLICT DO NOTHING;

-- 10. Demo Supplier Purchase Orders
INSERT INTO supplier_pos (tenant_id, supplier_name, order_number, status, order_date, expected_delivery_date, total_amount, notes) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'OPI Professional',
  'ORD-2024-001',
  'delivered',
  '2024-01-10 10:00:00+01',
  '2024-01-15 14:00:00+01',
  125.00,
  'Reguliere bestelling nagelverzorging producten'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Dermalogica',
  'ORD-2024-002',
  'shipped',
  '2024-01-12 09:00:00+01',
  '2024-01-18 16:00:00+01',
  285.00,
  'Gezichtsverzorging producten voor nieuwe behandelingen'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Hygiene Plus',
  'ORD-2024-003',
  'pending',
  '2024-01-16 11:30:00+01',
  '2024-01-22 10:00:00+01',
  85.00,
  'Verbruiksartikelen en handdoeken'
) ON CONFLICT (tenant_id, order_number) DO NOTHING;