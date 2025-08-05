-- Fix email template types to ensure consistency
-- This migration standardizes the template types across the system

-- Update any 'booking_confirmation' templates to 'appointment_confirmation'
UPDATE email_templates 
SET type = 'appointment_confirmation',
    updated_at = NOW()
WHERE type = 'booking_confirmation';

-- Update any 'booking_reminder' templates to 'appointment_reminder'
UPDATE email_templates 
SET type = 'appointment_reminder',
    updated_at = NOW()
WHERE type = 'booking_reminder';

-- Ensure the tenant 70721285-bee7-44f2-bcb9-b3eb8b3e92bb has proper templates
-- If no appointment_confirmation template exists for this tenant, create one
INSERT INTO email_templates (
  tenant_id,
  name,
  type,
  subject,
  body_html,
  body_text,
  variables,
  active,
  created_at,
  updated_at
)
SELECT 
  '70721285-bee7-44f2-bcb9-b3eb8b3e92bb',
  'Afspraak Bevestiging',
  'appointment_confirmation',
  'Afspraakbevestiging - {{service_name}} op {{appointment_date}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Afspraak Bevestiging</h2>
    <p>Beste {{client_name}},</p>
    <p>Uw afspraak is bevestigd!</p>
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="color: #333;">Afspraakdetails:</h3>
      <p><strong>Behandeling:</strong> {{service_name}}</p>
      <p><strong>Datum:</strong> {{appointment_date}}</p>
      <p><strong>Tijd:</strong> {{appointment_time}}</p>
      <p><strong>Medewerker:</strong> {{staff_name}}</p>
      <p><strong>Locatie:</strong> {{salon_name}}, {{salon_address}}</p>
    </div>
    <p>Wij verheugen ons op uw bezoek. Heeft u vragen? Neem gerust contact met ons op via {{salon_phone}} of {{salon_email}}.</p>
    <p>Met vriendelijke groet,<br>
    Het team van {{salon_name}}</p>
  </div>',
  'Beste {{client_name}},

Uw afspraak is bevestigd!

Afspraak Details:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Medewerker: {{staff_name}}
- Locatie: {{salon_name}}, {{salon_address}}

Wij verheugen ons op uw bezoek. Heeft u vragen? Neem gerust contact met ons op via {{salon_phone}} of {{salon_email}}.

Met vriendelijke groet,
Het team van {{salon_name}}',
  '[
    {"name": "client_name", "required": true, "description": "Naam van de klant"},
    {"name": "salon_name", "required": true, "description": "Naam van de salon"},
    {"name": "salon_address", "required": false, "description": "Adres van de salon"},
    {"name": "salon_phone", "required": false, "description": "Telefoonnummer van de salon"},
    {"name": "salon_email", "required": false, "description": "Email van de salon"},
    {"name": "service_name", "required": true, "description": "Naam van de behandeling"},
    {"name": "appointment_date", "required": true, "description": "Datum van de afspraak"},
    {"name": "appointment_time", "required": true, "description": "Tijd van de afspraak"},
    {"name": "staff_name", "required": false, "description": "Naam van de medewerker"}
  ]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates 
  WHERE tenant_id = '70721285-bee7-44f2-bcb9-b3eb8b3e92bb' 
  AND type = 'appointment_confirmation'
  AND active = true
);