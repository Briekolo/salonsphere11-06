import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface EmailTemplate {
  id: string
  tenant_id: string
  name: string
  type: string
  subject: string
  body_html: string
  body_text?: string
  variables: any[]
  active: boolean
}

export async function getEmailTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  templateType: string
): Promise<EmailTemplate | null> {
  console.log(`[EmailTemplate] Fetching template - Tenant: ${tenantId}, Type: ${templateType}`)
  
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', templateType)
      .eq('active', true)
      .single()

    if (error) {
      console.error('[EmailTemplate] Database error:', error.message)
      console.error('[EmailTemplate] Query params:', { tenantId, templateType })
      
      // If not found with primary type, try alternative type
      if (error.code === 'PGRST116' && templateType === 'appointment_confirmation') {
        console.log('[EmailTemplate] Trying alternative type: booking_confirmation')
        const { data: altData, error: altError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('type', 'booking_confirmation')
          .eq('active', true)
          .single()
        
        if (!altError && altData) {
          console.log('[EmailTemplate] Found template with alternative type')
          return altData
        }
      }
      
      return null
    }

    if (!data) {
      console.log('[EmailTemplate] No template found')
      return null
    }

    console.log('[EmailTemplate] Template found:', {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject?.substring(0, 50) + '...'
    })
    
    return data
  } catch (err) {
    console.error('[EmailTemplate] Unexpected error:', err)
    return null
  }
}

export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, any>
): { subject: string; html: string; text?: string } {
  console.log('[EmailTemplate] Rendering template:', template.name)
  console.log('[EmailTemplate] Available variables:', Object.keys(variables))
  
  let subject = template.subject
  let html = template.body_html
  let text = template.body_text

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    const stringValue = String(value || '')
    
    subject = subject.replace(pattern, stringValue)
    html = html.replace(pattern, stringValue)
    if (text) {
      text = text.replace(pattern, stringValue)
    }
  }

  console.log('[EmailTemplate] Rendered subject:', subject)
  
  return { subject, html, text }
}

// Default template fallbacks for when database templates are not available
export const defaultTemplates = {
  welcome: {
    subject: '🌟 Welkom bij {{salon_name}}!',
    html: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #02011F; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background-color: #f9f9f9; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>{{salon_name}}</h1>
        <p>Welkom!</p>
      </div>
      <div class="content">
        <p>Beste {{first_name}},</p>
        <p>Hartelijk welkom bij {{salon_name}}!</p>
        <p>We zijn verheugd dat u deel uitmaakt van onze salon familie. Bij ons staat kwaliteit en persoonlijke aandacht voorop.</p>
        <p>Heeft u vragen of wilt u een afspraak maken? Neem gerust contact met ons op.</p>
        <p>Met vriendelijke groet,<br>Het team van {{salon_name}}</p>
        {{#if salon_phone}}<p>Telefoon: {{salon_phone}}</p>{{/if}}
        {{#if salon_email}}<p>E-mail: {{salon_email}}</p>{{/if}}
      </div>
      <div class="footer">
        <p>Deze e-mail is automatisch gegenereerd.</p>
      </div>
    </div>
  </body>
</html>`
  },
  booking_confirmation: {
    subject: 'Afspraakbevestiging - {{service_name}} op {{appointment_date}}',
    html: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #02011F; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background-color: #f9f9f9; }
      .appointment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #02011F; }
      .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; color: #666; }
      .detail-value { color: #333; }
      .important-info { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>{{salon_name}}</h1>
        <p>Afspraakbevestiging</p>
      </div>
      <div class="content">
        <h2>Uw afspraak is bevestigd!</h2>
        <p>Beste {{client_name}},</p>
        <p>Bedankt voor uw boeking. Hierbij bevestigen wij uw afspraak bij {{salon_name}}.</p>
        
        <div class="appointment-details">
          <h3>Afspraakgegevens</h3>
          <div class="detail-row">
            <span class="detail-label">Behandeling:</span>
            <span class="detail-value">{{service_name}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">{{appointment_date}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tijd:</span>
            <span class="detail-value">{{appointment_time}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duur:</span>
            <span class="detail-value">{{duration_minutes}} minuten</span>
          </div>
          {{#if staff_name}}
          <div class="detail-row">
            <span class="detail-label">Behandelaar:</span>
            <span class="detail-value">{{staff_name}}</span>
          </div>
          {{/if}}
          {{#if salon_address}}
          <div class="detail-row">
            <span class="detail-label">Locatie:</span>
            <span class="detail-value">{{salon_address}}</span>
          </div>
          {{/if}}
        </div>
        
        <div class="important-info">
          <h4>Annulerings- en wijzigingsbeleid:</h4>
          <p>Afspraken kunnen tot 24 uur van tevoren kosteloos worden geannuleerd of gewijzigd.</p>
        </div>
        
        <p>We kijken ernaar uit u te mogen verwelkomen!</p>
        <p>Met vriendelijke groet,<br>{{salon_name}}</p>
        {{#if salon_phone}}<p>Voor vragen: {{salon_phone}}</p>{{/if}}
      </div>
      <div class="footer">
        <p>Deze e-mail is automatisch gegenereerd.</p>
      </div>
    </div>
  </body>
</html>`
  },
  booking_reminder: {
    subject: '⏰ Herinnering: {{service_name}} morgen om {{appointment_time}}',
    html: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #02011F; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background-color: #f9f9f9; }
      .appointment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #02011F; }
      .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; color: #666; }
      .detail-value { color: #333; }
      .reminder-tips { background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4caf50; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>{{salon_name}}</h1>
        <p>Afspraak Herinnering</p>
      </div>
      <div class="content">
        <h2>Herinnering: Uw afspraak morgen</h2>
        <p>Beste {{client_name}},</p>
        <p>Dit is een vriendelijke herinnering voor uw aanstaande afspraak bij {{salon_name}}.</p>
        
        <div class="appointment-details">
          <h3>Afspraakgegevens</h3>
          <div class="detail-row">
            <span class="detail-label">Behandeling:</span>
            <span class="detail-value">{{service_name}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">{{appointment_date}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tijd:</span>
            <span class="detail-value">{{appointment_time}}</span>
          </div>
          {{#if staff_name}}
          <div class="detail-row">
            <span class="detail-label">Behandelaar:</span>
            <span class="detail-value">{{staff_name}}</span>
          </div>
          {{/if}}
          {{#if salon_address}}
          <div class="detail-row">
            <span class="detail-label">Locatie:</span>
            <span class="detail-value">{{salon_address}}</span>
          </div>
          {{/if}}
        </div>
        
        <div class="reminder-tips">
          <h4>Tips voor uw bezoek:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Kom 5 minuten voor uw afspraak aan</li>
            <li>Neem eventuele inspiratiefoto's mee</li>
            <li>Informeer ons over allergieën of gevoeligheden</li>
          </ul>
        </div>
        
        <p>We kijken ernaar uit u morgen te zien!</p>
        <p>Mocht u uw afspraak willen wijzigen of annuleren, neem dan zo spoedig mogelijk contact met ons op.</p>
        <p>Met vriendelijke groet,<br>{{salon_name}}</p>
        {{#if salon_phone}}<p>Telefoon: {{salon_phone}}</p>{{/if}}
      </div>
      <div class="footer">
        <p>Deze e-mail is automatisch gegenereerd.</p>
      </div>
    </div>
  </body>
</html>`
  }
}

// Simple conditional replacement (not full handlebars)
export function processConditionals(html: string, variables: Record<string, any>): string {
  // First, ensure the HTML doesn't have already corrupted conditionals
  if (!html.includes('{{#if')) {
    return html
  }
  
  // Replace {{#if variable}} ... {{/if}} blocks
  const ifPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  return html.replace(ifPattern, (match, varName, content) => {
    // Check if variable exists and is not empty
    const value = variables[varName]
    const shouldShow = value !== undefined && value !== null && value !== ''
    return shouldShow ? content : ''
  })
}