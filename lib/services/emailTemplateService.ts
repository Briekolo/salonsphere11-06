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
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('type', category)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Map the existing table structure to the expected interface
    return data?.map(template => ({
      ...template,
      category: template.type,
      subject_line: template.subject,
      html_content: template.body_html,
      text_content: template.body_text,
      is_active: template.active
    })) || []
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

    // Map to existing table structure
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        tenant_id: tenantId,
        name: template.name,
        type: template.category || 'custom',
        subject: template.subject_line,
        body_html: template.html_content,
        body_text: template.text_content,
        variables: variables,
        active: true
      })
      .select()
      .single()

    if (error) throw error
    
    // Map back to expected structure
    return {
      ...data,
      category: data.type,
      subject_line: data.subject,
      html_content: data.body_html,
      text_content: data.body_text,
      is_active: data.active
    }
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
        name: 'Welkom',
        type: 'welcome',
        subject: 'Welkom bij {{salon_name}}!',
        body_html: '<p>Beste {{first_name}},</p><p>Welkom bij {{salon_name}}!</p><p>Met vriendelijke groet,<br>Het team</p>'
      },
      {
        name: 'Aanbieding',
        type: 'custom',
        subject: 'Speciale aanbieding van {{salon_name}}!',
        body_html: '<p>Beste {{first_name}},</p><p>We hebben een speciale aanbieding voor u!</p><p>Met vriendelijke groet,<br>{{salon_name}}</p>'
      },
      {
        name: 'Afspraak Herinnering',
        type: 'appointment_reminder',
        subject: 'Herinnering: Uw afspraak bij {{salon_name}}',
        body_html: '<p>Beste {{first_name}},</p><p>Dit is een herinnering voor uw afspraak bij {{salon_name}}.</p><p>Met vriendelijke groet,<br>Het team</p>'
      }
    ]

    // Insert all templates using existing table structure
    for (const template of templates) {
      await supabase
        .from('email_templates')
        .insert({
          ...template,
          tenant_id: tenantId,
          active: true,
          variables: this.extractVariables(template.body_html)
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