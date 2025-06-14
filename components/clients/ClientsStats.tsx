'use client'

import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/lib/hooks/useTenant'
import { supabase } from '@/lib/supabase'
import { startOfWeek as sow, endOfWeek as eow } from 'date-fns'

interface Stats {
  total: number
  newClients: number
  activeClients: number
  appointmentsWeek: number
}

export function ClientsStats() {
  const { tenantId } = useTenant()

  const { data, isLoading } = useQuery<Stats | null>({
    queryKey: ['clients_stats', tenantId],
    enabled: !!tenantId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) return null

      const now = new Date()
      const from30 = new Date(now)
      from30.setDate(from30.getDate() - 30)

      const from90 = new Date(now)
      from90.setDate(from90.getDate() - 90)

      const weekStart = sow(now, { weekStartsOn: 1 })
      const weekEnd = eow(now, { weekStartsOn: 1 })

      type CountTable = 'clients' | 'bookings'
      const countExact = async (
        table: CountTable,
        builder: (q: any) => any = (q) => q
      ): Promise<number> => {
        const { count, error } = await builder(
          supabase.from(table).select('*', { count: 'exact', head: true })
        )

        if (error) throw new Error(error.message)

        return count ?? 0
      }

      const total = await countExact('clients', q => q.eq('tenant_id', tenantId))
      const newClients = await countExact('clients', q=> q.eq('tenant_id', tenantId).gte('created_at', from30.toISOString()))
      const activeClients = await countExact('clients', q=> q.eq('tenant_id', tenantId).gte('last_visit_date', from90.toISOString()))
      const appointmentsWeek = await countExact('bookings', q=> q.eq('tenant_id', tenantId).gte('scheduled_at', weekStart.toISOString()).lte('scheduled_at', weekEnd.toISOString()))

      return { total, newClients, activeClients, appointmentsWeek }
    },
  })

  const stats = [
    {
      title: 'Totaal klanten',
      value: isLoading || !data ? '–' : String(data.total),
      icon: <Users className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Nieuwe klanten (30d)',
      value: isLoading || !data ? '–' : String(data.newClients),
      icon: <UserPlus className="w-5 h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Actieve klanten (90d)',
      value: isLoading || !data ? '–' : String(data.activeClients),
      icon: <TrendingUp className="w-5 h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Afspraken deze week',
      value: isLoading || !data ? '–' : String(data.appointmentsWeek),
      icon: <Calendar className="w-5 h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className="flex items-start justify-between">
            <div className={`metric-icon ${stat.iconBgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
          <div className="mt-4">
            <p className="metric-title">{stat.title}</p>
            <p className="metric-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}