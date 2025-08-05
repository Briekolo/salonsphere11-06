/*
  # Add Booking Confirmation Email Templates
  
  This migration adds booking_confirmation templates for existing tenants.
  The edge function looks for 'booking_confirmation' type but the database
  only had 'appointment_confirmation' templates.
*/

-- First, check if any tenants already have booking_confirmation templates
-- and only create for those who don't
INSERT INTO email_templates (
  tenant_id, 
  name, 
  type, 
  subject, 
  body_html, 
  body_text,
  variables, 
  active
)
SELECT 
  t.id as tenant_id,
  'Afspraak Bevestiging' as name,
  'booking_confirmation' as type,
  'Bevestiging van uw afspraak bij {{salon_name}}' as subject,
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Afspraak Bevestiging</h2>
    <p>Beste {{client_name}},</p>
    <p>Uw afspraak is bevestigd!</p>
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Afspraakdetails:</h3>
      <p><strong>Behandeling:</strong> {{service_name}}</p>
      <p><strong>Datum:</strong> {{appointment_date}}</p>
      <p><strong>Tijd:</strong> {{appointment_time}}</p>
      <p><strong>Duur:</strong> {{duration}} minuten</p>
      {{#if staff_name}}<p><strong>Medewerker:</strong> {{staff_name}}</p>{{/if}}
      {{#if notes}}<p><strong>Notities:</strong> {{notes}}</p>{{/if}}
      {{#if series_session_info}}<p><strong>Sessie:</strong> {{series_session_info}}</p>{{/if}}
    </div>
    <p>Wij kijken ernaar uit u te zien!</p>
    <p>Met vriendelijke groet,<br>
    {{salon_name}}<br>
    {{salon_address}}<br>
    {{salon_phone}}</p>
  </div>' as body_html,
  'Afspraak Bevestiging

Beste {{client_name}},

Uw afspraak is bevestigd!

Afspraakdetails:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Duur: {{duration}} minuten
{{#if staff_name}}- Medewerker: {{staff_name}}{{/if}}
{{#if notes}}- Notities: {{notes}}{{/if}}
{{#if series_session_info}}- Sessie: {{series_session_info}}{{/if}}

Wij kijken ernaar uit u te zien!

Met vriendelijke groet,
{{salon_name}}
{{salon_address}}
{{salon_phone}}' as body_text,
  '[
    {"name": "client_name", "description": "Naam van de klant", "required": true},
    {"name": "salon_name", "description": "Naam van de salon", "required": true},
    {"name": "salon_address", "description": "Adres van de salon", "required": false},
    {"name": "salon_phone", "description": "Telefoonnummer van de salon", "required": false},
    {"name": "service_name", "description": "Naam van de behandeling", "required": true},
    {"name": "appointment_date", "description": "Datum van de afspraak", "required": true},
    {"name": "appointment_time", "description": "Tijd van de afspraak", "required": true},
    {"name": "duration", "description": "Duur in minuten", "required": true},
    {"name": "staff_name", "description": "Naam van de medewerker", "required": false},
    {"name": "notes", "description": "Notities bij de afspraak", "required": false},
    {"name": "series_session_info", "description": "Sessie informatie voor behandelreeksen", "required": false}
  ]'::jsonb as variables,
  true as active
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 
  FROM email_templates et 
  WHERE et.tenant_id = t.id 
  AND et.type = 'booking_confirmation'
  AND et.active = true
);

-- Also update the booking_reminder template to use the correct format
UPDATE email_templates
SET 
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Afspraak Herinnering</h2>
    <p>Beste {{client_name}},</p>
    <p>Dit is een herinnering voor uw afspraak morgen.</p>
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Afspraakdetails:</h3>
      <p><strong>Behandeling:</strong> {{service_name}}</p>
      <p><strong>Datum:</strong> {{appointment_date}}</p>
      <p><strong>Tijd:</strong> {{appointment_time}}</p>
      <p><strong>Duur:</strong> {{duration}} minuten</p>
      {{#if staff_name}}<p><strong>Medewerker:</strong> {{staff_name}}</p>{{/if}}
    </div>
    <p>Tot morgen!</p>
    <p>Met vriendelijke groet,<br>
    {{salon_name}}<br>
    {{salon_address}}<br>
    {{salon_phone}}</p>
  </div>',
  body_text = 'Afspraak Herinnering

Beste {{client_name}},

Dit is een herinnering voor uw afspraak morgen.

Afspraakdetails:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Duur: {{duration}} minuten
{{#if staff_name}}- Medewerker: {{staff_name}}{{/if}}

Tot morgen!

Met vriendelijke groet,
{{salon_name}}
{{salon_address}}
{{salon_phone}}',
  variables = '[
    {"name": "client_name", "description": "Naam van de klant", "required": true},
    {"name": "salon_name", "description": "Naam van de salon", "required": true},
    {"name": "salon_address", "description": "Adres van de salon", "required": false},
    {"name": "salon_phone", "description": "Telefoonnummer van de salon", "required": false},
    {"name": "service_name", "description": "Naam van de behandeling", "required": true},
    {"name": "appointment_date", "description": "Datum van de afspraak", "required": true},
    {"name": "appointment_time", "description": "Tijd van de afspraak", "required": true},
    {"name": "duration", "description": "Duur in minuten", "required": true},
    {"name": "staff_name", "description": "Naam van de medewerker", "required": false}
  ]'::jsonb
WHERE type = 'appointment_reminder';

-- Update the function that creates default templates for new tenants
CREATE OR REPLACE FUNCTION create_default_email_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert email templates using existing table structure
  INSERT INTO email_templates (tenant_id, name, type, subject, body_html, body_text, variables, active) VALUES
  
  -- Welcome Email
  (NEW.id, 'Welkom', 'welcome', 'Welkom bij {{salon_name}}!', 
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welkom bij {{salon_name}}!</h2>
    <p>Beste {{first_name}},</p>
    <p>Hartelijk welkom bij {{salon_name}}! We zijn verheugd u als nieuwe klant te mogen verwelkomen.</p>
    <p>U kunt nu online afspraken maken via onze website.</p>
    <p>Met vriendelijke groet,<br>Het team van {{salon_name}}</p>
  </div>',
  'Welkom bij {{salon_name}}!

Beste {{first_name}},

Hartelijk welkom bij {{salon_name}}! We zijn verheugd u als nieuwe klant te mogen verwelkomen.

U kunt nu online afspraken maken via onze website.

Met vriendelijke groet,
Het team van {{salon_name}}',
  '[{"name": "salon_name", "description": "Naam van de salon"}, {"name": "first_name", "description": "Voornaam van de klant"}]'::jsonb, true),

  -- Promotional
  (NEW.id, 'Aanbieding', 'custom', 'Speciale aanbieding van {{salon_name}}!',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Speciale aanbieding!</h2>
    <p>Beste {{first_name}},</p>
    <p>We hebben een speciale aanbieding voor u!</p>
    <p>Met vriendelijke groet,<br>{{salon_name}}</p>
  </div>',
  'Speciale aanbieding!

Beste {{first_name}},

We hebben een speciale aanbieding voor u!

Met vriendelijke groet,
{{salon_name}}', 
  '[{"name": "salon_name", "description": "Naam van de salon"}, {"name": "first_name", "description": "Voornaam van de klant"}]'::jsonb, true),

  -- Booking Confirmation
  (NEW.id, 'Afspraak Bevestiging', 'booking_confirmation', 'Bevestiging van uw afspraak bij {{salon_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Afspraak Bevestiging</h2>
    <p>Beste {{client_name}},</p>
    <p>Uw afspraak is bevestigd!</p>
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Afspraakdetails:</h3>
      <p><strong>Behandeling:</strong> {{service_name}}</p>
      <p><strong>Datum:</strong> {{appointment_date}}</p>
      <p><strong>Tijd:</strong> {{appointment_time}}</p>
      <p><strong>Duur:</strong> {{duration}} minuten</p>
      {{#if staff_name}}<p><strong>Medewerker:</strong> {{staff_name}}</p>{{/if}}
    </div>
    <p>Wij kijken ernaar uit u te zien!</p>
    <p>Met vriendelijke groet,<br>{{salon_name}}</p>
  </div>',
  'Afspraak Bevestiging

Beste {{client_name}},

Uw afspraak is bevestigd!

Afspraakdetails:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Duur: {{duration}} minuten

Wij kijken ernaar uit u te zien!

Met vriendelijke groet,
{{salon_name}}',
  '[
    {"name": "client_name", "description": "Naam van de klant", "required": true},
    {"name": "salon_name", "description": "Naam van de salon", "required": true},
    {"name": "service_name", "description": "Naam van de behandeling", "required": true},
    {"name": "appointment_date", "description": "Datum van de afspraak", "required": true},
    {"name": "appointment_time", "description": "Tijd van de afspraak", "required": true},
    {"name": "duration", "description": "Duur in minuten", "required": true},
    {"name": "staff_name", "description": "Naam van de medewerker", "required": false}
  ]'::jsonb, true),

  -- Appointment Reminder
  (NEW.id, 'Afspraak Herinnering', 'appointment_reminder', 'Herinnering: Uw afspraak bij {{salon_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Afspraak Herinnering</h2>
    <p>Beste {{client_name}},</p>
    <p>Dit is een herinnering voor uw afspraak morgen.</p>
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Afspraakdetails:</h3>
      <p><strong>Behandeling:</strong> {{service_name}}</p>
      <p><strong>Datum:</strong> {{appointment_date}}</p>
      <p><strong>Tijd:</strong> {{appointment_time}}</p>
      <p><strong>Duur:</strong> {{duration}} minuten</p>
      {{#if staff_name}}<p><strong>Medewerker:</strong> {{staff_name}}</p>{{/if}}
    </div>
    <p>Tot morgen!</p>
    <p>Met vriendelijke groet,<br>{{salon_name}}</p>
  </div>',
  'Afspraak Herinnering

Beste {{client_name}},

Dit is een herinnering voor uw afspraak morgen.

Afspraakdetails:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Duur: {{duration}} minuten

Tot morgen!

Met vriendelijke groet,
{{salon_name}}',
  '[
    {"name": "client_name", "description": "Naam van de klant", "required": true},
    {"name": "salon_name", "description": "Naam van de salon", "required": true},
    {"name": "service_name", "description": "Naam van de behandeling", "required": true},
    {"name": "appointment_date", "description": "Datum van de afspraak", "required": true},
    {"name": "appointment_time", "description": "Tijd van de afspraak", "required": true},
    {"name": "duration", "description": "Duur in minuten", "required": true},
    {"name": "staff_name", "description": "Naam van de medewerker", "required": false}
  ]'::jsonb, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;