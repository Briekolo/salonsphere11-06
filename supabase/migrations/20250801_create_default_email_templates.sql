/*
  # Create Default Email Templates for New Tenants
  
  This migration adds a function and trigger to automatically create
  default email templates when a new tenant is created.
*/

-- Create function to create default email templates for new tenants
CREATE OR REPLACE FUNCTION create_default_email_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert only 3 basic email templates using existing table structure
  INSERT INTO email_templates (tenant_id, name, type, subject, body_html, variables, active) VALUES
  
  -- Welcome Email
  (NEW.id, 'Welkom', 'welcome', 'Welkom bij {{salon_name}}!', 
  '<p>Beste {{first_name}},</p><p>Welkom bij {{salon_name}}!</p><p>Met vriendelijke groet,<br>Het team</p>', 
  '[{"name": "salon_name", "description": "Naam van de salon"}, {"name": "first_name", "description": "Voornaam van de klant"}]'::jsonb, true),

  -- Promotional
  (NEW.id, 'Aanbieding', 'custom', 'Speciale aanbieding van {{salon_name}}!',
  '<p>Beste {{first_name}},</p><p>We hebben een speciale aanbieding voor u!</p><p>Met vriendelijke groet,<br>{{salon_name}}</p>', 
  '[{"name": "salon_name", "description": "Naam van de salon"}, {"name": "first_name", "description": "Voornaam van de klant"}]'::jsonb, true),

  -- Appointment Reminder
  (NEW.id, 'Afspraak Herinnering', 'appointment_reminder', 'Herinnering: Uw afspraak bij {{salon_name}}',
  '<p>Beste {{first_name}},</p><p>Dit is een herinnering voor uw afspraak bij {{salon_name}}.</p><p>Met vriendelijke groet,<br>Het team</p>', 
  '[{"name": "salon_name", "description": "Naam van de salon"}, {"name": "first_name", "description": "Voornaam van de klant"}]'::jsonb, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default email templates for new tenants
CREATE TRIGGER create_default_email_templates_trigger
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION create_default_email_templates();