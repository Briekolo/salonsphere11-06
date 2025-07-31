import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CampaignMetrics {
  totalCampaigns: number
  activeCampaigns: number
  totalEmailsSent: number
  averageOpenRate: number
  averageClickRate: number
  totalRevenue: number
  recentCampaigns: any[]
  performanceByMonth: any[]
  segmentPerformance: any[]
}

export function useCampaignAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: ['campaignAnalytics', period],
    queryFn: async () => {
      // Get date range based on period
      const now = new Date()
      const startDate = new Date()
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      // Get campaign statistics
      const { data: campaigns, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (campaignsError) throw campaignsError

      // Calculate metrics
      const totalCampaigns = campaigns?.length || 0
      const activeCampaigns = campaigns?.filter(c => ['sending', 'scheduled'].includes(c.status)).length || 0
      const totalEmailsSent = campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0
      const totalOpened = campaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0
      const totalClicked = campaigns?.reduce((sum, c) => sum + (c.total_clicked || 0), 0) || 0

      const averageOpenRate = totalEmailsSent > 0 ? (totalOpened / totalEmailsSent) * 100 : 0
      const averageClickRate = totalEmailsSent > 0 ? (totalClicked / totalEmailsSent) * 100 : 0

      // Get recent campaigns with details
      const recentCampaigns = campaigns
        ?.filter(c => c.status === 'sent')
        .sort((a, b) => new Date(b.sent_at || b.created_at).getTime() - new Date(a.sent_at || a.created_at).getTime())
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          sent: c.total_sent || 0,
          opened: c.total_opened || 0,
          clicked: c.total_clicked || 0,
          openRate: c.total_sent ? ((c.total_opened || 0) / c.total_sent) * 100 : 0,
          clickRate: c.total_sent ? ((c.total_clicked || 0) / c.total_sent) * 100 : 0,
          sentDate: c.sent_at || c.created_at
        })) || []

      // Group performance by month
      const performanceByMonth = []
      const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
      
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date()
        monthDate.setMonth(monthDate.getMonth() - i)
        const monthCampaigns = campaigns?.filter(c => {
          const campaignDate = new Date(c.sent_at || c.created_at)
          return campaignDate.getMonth() === monthDate.getMonth() && 
                 campaignDate.getFullYear() === monthDate.getFullYear()
        }) || []

        const monthSent = monthCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)
        const monthOpened = monthCampaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0)
        const monthClicked = monthCampaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0)

        performanceByMonth.unshift({
          name: monthNames[monthDate.getMonth()],
          sent: monthSent,
          opened: monthOpened,
          clicked: monthClicked
        })
      }

      // Get segment performance
      const { data: segments } = await supabase
        .from('customer_segments')
        .select('id, name')

      const segmentPerformance = await Promise.all((segments || []).map(async (segment) => {
        const { data: segmentCampaigns } = await supabase
          .from('marketing_campaigns')
          .select('total_sent, total_opened, total_clicked')
          .eq('segment_id', segment.id)
          .gte('created_at', startDate.toISOString())

        const totalSent = segmentCampaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0
        const totalOpened = segmentCampaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0
        const totalClicked = segmentCampaigns?.reduce((sum, c) => sum + (c.total_clicked || 0), 0) || 0

        return {
          segment: segment.name,
          openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
          clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
          conversionRate: 0 // TODO: Implement conversion tracking
        }
      }))

      return {
        totalCampaigns,
        activeCampaigns,
        totalEmailsSent,
        averageOpenRate,
        averageClickRate,
        totalRevenue: 0, // TODO: Implement revenue tracking
        recentCampaigns,
        performanceByMonth,
        segmentPerformance
      }
    },
    refetchInterval: 60000 // Refresh every minute
  })
}

export function useEmailMetrics(campaignId?: string) {
  return useQuery({
    queryKey: ['emailMetrics', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('email_metrics')
        .select('*')
        .order('event_timestamp', { ascending: false })
        .limit(100)

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      const { data, error } = await query

      if (error) throw error

      // Group metrics by event type
      const metrics = {
        delivered: data?.filter(m => m.event_type === 'delivered').length || 0,
        opened: data?.filter(m => m.event_type === 'opened').length || 0,
        clicked: data?.filter(m => m.event_type === 'clicked').length || 0,
        bounced: data?.filter(m => m.event_type === 'bounced').length || 0,
        complained: data?.filter(m => m.event_type === 'complained').length || 0,
        unsubscribed: data?.filter(m => m.event_type === 'unsubscribed').length || 0,
        events: data || []
      }

      return metrics
    },
    enabled: !!campaignId,
    refetchInterval: 30000 // Refresh every 30 seconds
  })
}