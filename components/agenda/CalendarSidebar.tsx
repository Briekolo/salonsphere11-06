'use client'

import { useState, useEffect } from 'react'
import { Plus, Inbox, CheckCircle, Calendar, Lightbulb, BarChart3, Users, Settings, Gift, Puzzle, HelpCircle } from 'lucide-react'
import { useTenant } from '@/lib/hooks/useTenant'
import { supabase } from '@/lib/supabase'

interface CalendarSidebarProps {
  onNewAppointment: () => void
  isMobile?: boolean
}

interface SidebarStats {
  newBookings: number
  pendingApprovals: number
  totalAppointments: number
  completionRate: number
  daysLeft: number
}

export function CalendarSidebar({ onNewAppointment, isMobile = false }: CalendarSidebarProps) {
  const { tenantId } = useTenant()
  const [stats, setStats] = useState<SidebarStats>({
    newBookings: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    completionRate: 60,
    daysLeft: 10
  })
  
  // Fetch sidebar statistics
  useEffect(() => {
    if (!tenantId) return
    
    const fetchStats = async () => {
      // Get new bookings count (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { count: newBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', yesterday.toISOString())
      
      // Get pending approvals
      const { count: pendingApprovals } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'scheduled')
      
      // Get total appointments this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { count: totalAppointments } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', startOfMonth.toISOString())
      
      setStats(prev => ({
        ...prev,
        newBookings: newBookings || 0,
        pendingApprovals: pendingApprovals || 0,
        totalAppointments: totalAppointments || 0
      }))
    }
    
    fetchStats()
  }, [tenantId])
  
  const navigationItems = [
    { 
      icon: Inbox, 
      label: 'Inbox', 
      count: stats.newBookings,
      onClick: () => console.log('Inbox clicked')
    },
    { 
      icon: CheckCircle, 
      label: 'Goedkeuringen', 
      count: stats.pendingApprovals,
      onClick: () => console.log('Approvals clicked')
    },
    { 
      icon: Calendar, 
      label: 'Alle Afspraken',
      onClick: () => console.log('All appointments clicked')
    },
    { 
      icon: Lightbulb, 
      label: 'Ideeën',
      onClick: () => console.log('Ideas clicked')
    },
    { 
      icon: BarChart3, 
      label: 'Analytics',
      onClick: () => console.log('Analytics clicked')
    }
  ]
  
  const workspaceItems = [
    { icon: Users, label: 'Uitnodigingen' },
    { icon: Settings, label: 'Instellingen' },
    { icon: Puzzle, label: 'Integraties' },
    { icon: HelpCircle, label: 'Help' }
  ]
  
  return (
    <div className={`assembly-sidebar ${isMobile ? 'w-64' : 'w-60'} bg-gray-50 border-r border-gray-200 flex flex-col h-full`}>
      {/* New Appointment Button */}
      <div className="p-4">
        <button
          onClick={onNewAppointment}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#02011F] text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium text-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Afspraak
        </button>
      </div>
      
      {/* Navigation Section */}
      <div className="flex-1 px-2">
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notificaties</p>
        </div>
        
        {navigationItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left group min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              <span className="text-sm text-gray-700 font-medium">{item.label}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Posts Section */}
      <div className="px-2 mb-4">
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Posts</p>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left min-h-[44px]">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 font-medium">Alle Posts</span>
        </button>
      </div>
      
      {/* Analytics Section */}
      <div className="px-2 mb-4">
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Analytics</p>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left min-h-[44px]">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 font-medium">Analytics</span>
        </button>
      </div>
      
      {/* Workspace Section */}
      <div className="px-2 mb-4">
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Werkruimte</p>
        </div>
        
        {workspaceItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left min-h-[44px]"
          >
            <item.icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      
      {/* Status Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">{stats.completionRate}% Voltooid</span>
            <span className="text-xs text-gray-500">Getting Started</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Basic Plan trial</span>
          <span className="text-xs font-medium text-gray-700">{stats.daysLeft} dagen over</span>
        </div>
      </div>
    </div>
  )
}