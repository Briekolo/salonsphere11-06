import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { EmailService } from './emailService'

export interface Campaign {
  id?: string
  tenant_id: string
  name: string
  subject_line: string
  subject_line_b?: string
  template_id?: string
  segment_id?: string
  content: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  send_type: 'immediate' | 'scheduled'
  scheduled_at?: string
  sent_at?: string
  completed_at?: string
  ab_test_enabled?: boolean
  ab_test_percentage?: number
  ab_winner?: 'a' | 'b'
  total_recipients?: number
  total_sent?: number
  total_opened?: number
  total_clicked?: number
  total_bounced?: number
  total_unsubscribed?: number
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface CampaignRecipient {
  id?: string
  campaign_id: string
  client_id: string
  email: string
  variant?: 'a' | 'b'
  status?: 'pending' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
  sent_at?: string
  delivered_at?: string
  bounced_at?: string
  failed_at?: string
  failure_reason?: string
  opened_at?: string
  clicked_at?: string
  unsubscribed_at?: string
  message_id?: string
}

export class CampaignService {
  // Get all campaigns for tenant
  static async getCampaigns(tenantId?: string) {
    const effectiveTenantId = tenantId || await getCurrentUserTenantId()
    if (!effectiveTenantId) throw new Error('No tenant ID available')

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get single campaign
  static async getCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select(`
        *,
        email_templates (
          id,
          name,
          html_content,
          text_content
        ),
        customer_segments (
          id,
          name,
          member_count
        )
      `)
      .eq('id', campaignId)
      .single()

    if (error) throw error
    return data
  }

  // Create new campaign
  static async createCampaign(campaign: Partial<Campaign>) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        ...campaign,
        tenant_id: tenantId,
        created_by: user.user.id,
        status: campaign.status || 'draft'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update campaign
  static async updateCampaign(campaignId: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete campaign
  static async deleteCampaign(campaignId: string) {
    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', campaignId)

    if (error) throw error
  }

  // Add recipients to campaign
  static async addRecipients(campaignId: string, clientIds: string[]) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    // Get client emails
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, email')
      .in('id', clientIds)
      .eq('tenant_id', tenantId)

    if (clientError) throw clientError

    // Check for unsubscribes
    const { data: unsubscribes } = await supabase
      .from('unsubscribes')
      .select('email')
      .eq('tenant_id', tenantId)

    const unsubscribedEmails = new Set(unsubscribes?.map(u => u.email) || [])

    // Filter out unsubscribed clients and create recipient records
    const recipients = clients
      .filter(client => client.email && !unsubscribedEmails.has(client.email))
      .map(client => ({
        campaign_id: campaignId,
        client_id: client.id,
        email: client.email,
        variant: 'a' // Default variant, will be updated if A/B test is enabled
      }))

    if (recipients.length === 0) {
      return { count: 0 }
    }

    const { data, error } = await supabase
      .from('campaign_recipients')
      .insert(recipients)
      .select()

    if (error) throw error

    // Update campaign recipient count
    await supabase
      .from('marketing_campaigns')
      .update({ total_recipients: recipients.length })
      .eq('id', campaignId)

    return { count: data.length, recipients: data }
  }

  // Add recipients from segment
  static async addRecipientsFromSegment(campaignId: string, segmentId: string) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('id', segmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (segmentError) throw segmentError

    // For now, get all clients (segment criteria will be implemented later)
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', tenantId)
      .not('email', 'is', null)

    if (clientError) throw clientError

    const clientIds = clients.map(c => c.id)
    return this.addRecipients(campaignId, clientIds)
  }

  // Send campaign
  static async sendCampaign(campaignId: string) {
    const campaign = await this.getCampaign(campaignId)
    if (!campaign) throw new Error('Campaign not found')

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign must be in draft or scheduled status to send')
    }

    // Update campaign status
    await this.updateCampaign(campaignId, { 
      status: 'sending',
      sent_at: new Date().toISOString()
    })

    // Get recipients
    const { data: recipients, error: recipientError } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (recipientError) throw recipientError

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients found for campaign')
    }

    // Queue emails for sending
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    const emailQueueItems = recipients.map(recipient => ({
      tenant_id: tenantId,
      campaign_id: campaignId,
      recipient_id: recipient.id,
      to_email: recipient.email,
      subject: recipient.variant === 'b' && campaign.subject_line_b 
        ? campaign.subject_line_b 
        : campaign.subject_line,
      html_content: campaign.content,
      text_content: null, // TODO: Generate plain text version
      scheduled_for: new Date().toISOString()
    }))

    // Insert into email queue
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert(emailQueueItems)

    if (queueError) throw queueError

    // Update recipient status
    const recipientIds = recipients.map(r => r.id)
    await supabase
      .from('campaign_recipients')
      .update({ status: 'queued' })
      .in('id', recipientIds)

    // Trigger edge function to process queue
    const { error: functionError } = await supabase.functions.invoke('send-marketing-campaign', {
      body: { campaign_id: campaignId }
    })

    if (functionError) {
      console.error('Error triggering edge function:', functionError)
      // Don't throw - emails are queued and can be processed later
    }

    return { queued: recipients.length }
  }

  // Schedule campaign
  static async scheduleCampaign(campaignId: string, scheduledAt: Date) {
    const campaign = await this.getCampaign(campaignId)
    if (!campaign) throw new Error('Campaign not found')

    if (campaign.status !== 'draft') {
      throw new Error('Only draft campaigns can be scheduled')
    }

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({
        status: 'scheduled',
        send_type: 'scheduled',
        scheduled_at: scheduledAt.toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Pause campaign
  static async pauseCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignId)
      .in('status', ['sending', 'scheduled'])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Resume campaign
  static async resumeCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)
      .eq('status', 'paused')
      .select()
      .single()

    if (error) throw error

    // Trigger edge function to continue processing
    await supabase.functions.invoke('send-marketing-campaign', {
      body: { campaign_id: campaignId }
    })

    return data
  }

  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: string) {
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select(`
        *,
        campaign_recipients (
          status,
          opened_at,
          clicked_at,
          unsubscribed_at
        )
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError) throw campaignError

    // Calculate rates
    const totalSent = campaign.total_sent || 0
    const openRate = totalSent > 0 ? (campaign.total_opened || 0) / totalSent * 100 : 0
    const clickRate = totalSent > 0 ? (campaign.total_clicked || 0) / totalSent * 100 : 0
    const bounceRate = totalSent > 0 ? (campaign.total_bounced || 0) / totalSent * 100 : 0
    const unsubscribeRate = totalSent > 0 ? (campaign.total_unsubscribed || 0) / totalSent * 100 : 0

    return {
      campaign,
      metrics: {
        totalRecipients: campaign.total_recipients || 0,
        totalSent: totalSent,
        totalOpened: campaign.total_opened || 0,
        totalClicked: campaign.total_clicked || 0,
        totalBounced: campaign.total_bounced || 0,
        totalUnsubscribed: campaign.total_unsubscribed || 0,
        openRate: openRate.toFixed(1),
        clickRate: clickRate.toFixed(1),
        bounceRate: bounceRate.toFixed(1),
        unsubscribeRate: unsubscribeRate.toFixed(1)
      }
    }
  }

  // Get campaign recipient details
  static async getCampaignRecipients(campaignId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('campaign_recipients')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      recipients: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}