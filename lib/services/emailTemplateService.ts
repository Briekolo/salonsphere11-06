import { supabase, getCurrentUserTenantId } from '@/lib/supabase'

export interface EmailTemplate {
  id?: string
  tenant_id: string
  name: string
  category: 'general' | 'promotional' | 'transactional' | 'newsletter' | 'automated'
  subject_line: string
  html_content: string
  text_content?: string
  thumbnail_url?: string
  variables?: TemplateVariable[]
  times_used?: number
  avg_open_rate?: number
  avg_click_rate?: number
  is_active?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface TemplateVariable {
  name: string
  description: string
  default_value?: string
  required?: boolean
}

export class EmailTemplateService {
  // Get all templates for tenant
  static async getTemplates(tenantId?: string, category?: string) {
    const effectiveTenantId = tenantId || await getCurrentUserTenantId()
    if (!effectiveTenantId) throw new Error('No tenant ID available')

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Get single template
  static async getTemplate(templateId: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error
    return data
  }

  // Create new template
  static async createTemplate(template: Partial<EmailTemplate>) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    // Extract variables from HTML content
    const variables = this.extractVariables(template.html_content || '')

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        tenant_id: tenantId,
        created_by: user.user.id,
        variables: variables,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update template
  static async updateTemplate(templateId: string, updates: Partial<EmailTemplate>) {
    // If HTML content is being updated, extract new variables
    if (updates.html_content) {
      updates.variables = this.extractVariables(updates.html_content)
    }

    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete template
  static async deleteTemplate(templateId: string) {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('id', templateId)

    if (error) throw error
  }

  // Duplicate template
  static async duplicateTemplate(templateId: string, newName: string) {
    const template = await this.getTemplate(templateId)
    if (!template) throw new Error('Template not found')

    const { id, created_at, updated_at, times_used, avg_open_rate, avg_click_rate, ...templateData } = template

    return this.createTemplate({
      ...templateData,
      name: newName
    })
  }

  // Extract variables from HTML content
  static extractVariables(htmlContent: string): TemplateVariable[] {
    const variablePattern = /\{\{([^}]+)\}\}/g
    const matches = htmlContent.matchAll(variablePattern)
    const variableMap = new Map<string, TemplateVariable>()

    for (const match of matches) {
      const varName = match[1].trim()
      if (!variableMap.has(varName)) {
        variableMap.set(varName, {
          name: varName,
          description: this.getVariableDescription(varName),
          default_value: this.getVariableDefault(varName),
          required: this.isVariableRequired(varName)
        })
      }
    }

    return Array.from(variableMap.values())
  }

  // Get variable description based on common names
  static getVariableDescription(varName: string): string {
    const descriptions: Record<string, string> = {
      'client_name': 'Naam van de klant',
      'first_name': 'Voornaam van de klant',
      'last_name': 'Achternaam van de klant',
      'salon_name': 'Naam van de salon',
      'appointment_date': 'Datum van de afspraak',
      'appointment_time': 'Tijd van de afspraak',
      'service_name': 'Naam van de behandeling',
      'staff_name': 'Naam van de medewerker',
      'unsubscribe_link': 'Link om uit te schrijven',
      'view_online_link': 'Link om online te bekijken'
    }

    return descriptions[varName.toLowerCase()] || varName
  }

  // Get variable default value
  static getVariableDefault(varName: string): string {
    const defaults: Record<string, string> = {
      'client_name': 'Klant',
      'first_name': '',
      'last_name': '',
      'salon_name': '',
      'unsubscribe_link': '#',
      'view_online_link': '#'
    }

    return defaults[varName.toLowerCase()] || ''
  }

  // Check if variable is required
  static isVariableRequired(varName: string): boolean {
    const required = ['unsubscribe_link']
    return required.includes(varName.toLowerCase())
  }

  // Render template with variables
  static renderTemplate(template: EmailTemplate, variables: Record<string, string>): string {
    let rendered = template.html_content

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      rendered = rendered.replace(pattern, value || '')
    }

    // Replace any remaining variables with defaults
    if (template.variables) {
      for (const variable of template.variables) {
        const pattern = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g')
        rendered = rendered.replace(pattern, variable.default_value || '')
      }
    }

    return rendered
  }

  // Create default templates for new tenants
  static async createDefaultTemplates(tenantId: string) {
    const templates = [
      {
        name: 'Welkom E-mail',
        category: 'automated' as const,
        subject_line: 'Welkom bij {{salon_name}}!',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #02011F; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 30px; background-color: #02011F; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{salon_name}}</h1>
    </div>
    <div class="content">
      <h2>Welkom {{first_name}}!</h2>
      <p>We zijn blij dat je hebt gekozen voor {{salon_name}}. We kijken ernaar uit om je te verwelkomen in onze salon.</p>
      
      <p>Bij ons kun je terecht voor:</p>
      <ul>
        <li>Professionele haarbehandelingen</li>
        <li>Persoonlijk advies</li>
        <li>Een ontspannen ervaring</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="#" class="button">Boek je eerste afspraak</a>
      </p>
      
      <p>Heb je vragen? Neem gerust contact met ons op!</p>
      
      <p>Met vriendelijke groet,<br>
      Het team van {{salon_name}}</p>
    </div>
    <div class="footer">
      <p><a href="{{unsubscribe_link}}">Uitschrijven</a> | <a href="{{view_online_link}}">Bekijk online</a></p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        name: 'Lente Aanbieding',
        category: 'promotional' as const,
        subject_line: '🌸 Lente Special - 20% korting op alle behandelingen!',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #02011F; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: #f9f9f9; }
    .offer-box { background-color: #fff; padding: 20px; border: 2px solid #02011F; border-radius: 10px; margin: 20px 0; text-align: center; }
    .offer-code { font-size: 24px; font-weight: bold; color: #02011F; }
    .button { display: inline-block; padding: 12px 30px; background-color: #02011F; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Lente Specials bij {{salon_name}}</h1>
    </div>
    <div class="content">
      <p>Beste {{first_name}},</p>
      
      <p>De lente is begonnen! Tijd voor een frisse start met een nieuwe look.</p>
      
      <div class="offer-box">
        <h2>20% KORTING</h2>
        <p>op alle behandelingen</p>
        <p class="offer-code">Code: LENTE2024</p>
        <p><small>Geldig t/m 30 april 2024</small></p>
      </div>
      
      <p style="text-align: center;">
        <a href="#" class="button">Boek Nu</a>
      </p>
      
      <p>Wacht niet te lang, want vol = vol!</p>
      
      <p>Tot snel in de salon!</p>
      
      <p>Met vriendelijke groet,<br>
      {{salon_name}}</p>
    </div>
    <div class="footer">
      <p><a href="{{unsubscribe_link}}">Uitschrijven</a> | <a href="{{view_online_link}}">Bekijk online</a></p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        name: 'Maandelijkse Nieuwsbrief',
        category: 'newsletter' as const,
        subject_line: '{{salon_name}} Nieuwsbrief - {{month}} {{year}}',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #02011F; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: #f9f9f9; }
    .section { background-color: white; padding: 20px; margin: 20px 0; border-radius: 10px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #02011F; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{salon_name}} Nieuwsbrief</h1>
      <p>{{month}} {{year}}</p>
    </div>
    <div class="content">
      <p>Beste {{first_name}},</p>
      
      <div class="section">
        <h2>🌟 Nieuws uit de salon</h2>
        <p>Dit gebeurt er deze maand in onze salon...</p>
        <ul>
          <li>Nieuwe behandelingen toegevoegd</li>
          <li>Verlengde openingstijden op vrijdag</li>
          <li>Team uitbreiding - welkom Sarah!</li>
        </ul>
      </div>
      
      <div class="section">
        <h2>💡 Beauty Tips</h2>
        <p>Deze maand delen we onze beste tips voor gezond haar in de lente...</p>
      </div>
      
      <div class="section">
        <h2>🎁 Speciale Aanbieding</h2>
        <p>Exclusief voor nieuwsbrief abonnees: 10% korting op je volgende behandeling!</p>
        <p style="text-align: center;">
          <a href="#" class="button">Claim je korting</a>
        </p>
      </div>
      
      <p>Tot ziens in de salon!</p>
      
      <p>Met vriendelijke groet,<br>
      Het team van {{salon_name}}</p>
    </div>
    <div class="footer">
      <p><a href="{{unsubscribe_link}}">Uitschrijven</a> | <a href="{{view_online_link}}">Bekijk online</a></p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        name: 'Verjaardag Wensen',
        category: 'automated' as const,
        subject_line: '🎉 Gefeliciteerd {{first_name}}! Speciale verjaardagsaanbieding',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #02011F; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: #f9f9f9; }
    .birthday-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .gift-code { background-color: white; color: #02011F; padding: 15px 30px; border-radius: 5px; display: inline-block; font-size: 20px; font-weight: bold; margin: 10px 0; }
    .button { display: inline-block; padding: 12px 30px; background-color: white; color: #02011F; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎂 Gefeliciteerd!</h1>
    </div>
    <div class="content">
      <p>Beste {{first_name}},</p>
      
      <p>Het hele team van {{salon_name}} wenst je een fantastische verjaardag!</p>
      
      <div class="birthday-box">
        <h2>🎁 Ons cadeau voor jou</h2>
        <p>25% KORTING op een behandeling naar keuze!</p>
        <div class="gift-code">BDAY-{{client_code}}</div>
        <p><small>Geldig tot 30 dagen na je verjaardag</small></p>
        <a href="#" class="button">Boek je verjaardagsbehandeling</a>
      </div>
      
      <p>We hopen je snel te zien om samen je verjaardag te vieren met een heerlijke behandeling!</p>
      
      <p>Nogmaals gefeliciteerd en een fijne dag gewenst!</p>
      
      <p>Liefs,<br>
      Het team van {{salon_name}}</p>
    </div>
    <div class="footer">
      <p><a href="{{unsubscribe_link}}">Uitschrijven</a> | <a href="{{view_online_link}}">Bekijk online</a></p>
    </div>
  </div>
</body>
</html>
        `
      }
    ]

    // Insert all templates
    for (const template of templates) {
      await supabase
        .from('email_templates')
        .insert({
          ...template,
          tenant_id: tenantId,
          is_active: true,
          variables: this.extractVariables(template.html_content)
        })
    }
  }

  // Get template categories
  static getCategories() {
    return [
      { value: 'general', label: 'Algemeen' },
      { value: 'promotional', label: 'Promoties' },
      { value: 'transactional', label: 'Transactioneel' },
      { value: 'newsletter', label: 'Nieuwsbrief' },
      { value: 'automated', label: 'Geautomatiseerd' }
    ]
  }

  // Update template metrics after campaign
  static async updateTemplateMetrics(templateId: string, openRate: number, clickRate: number) {
    const { data: template } = await supabase
      .from('email_templates')
      .select('times_used, avg_open_rate, avg_click_rate')
      .eq('id', templateId)
      .single()

    if (template) {
      const timesUsed = (template.times_used || 0) + 1
      const currentAvgOpen = template.avg_open_rate || 0
      const currentAvgClick = template.avg_click_rate || 0

      // Calculate new averages
      const newAvgOpen = ((currentAvgOpen * (timesUsed - 1)) + openRate) / timesUsed
      const newAvgClick = ((currentAvgClick * (timesUsed - 1)) + clickRate) / timesUsed

      await supabase
        .from('email_templates')
        .update({
          times_used: timesUsed,
          avg_open_rate: newAvgOpen,
          avg_click_rate: newAvgClick
        })
        .eq('id', templateId)
    }
  }
}