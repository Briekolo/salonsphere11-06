'use client'

import { ArrowRight, Clock, ChevronRight, Calendar, User, Scissors } from 'lucide-react'
import { useTodaysAppointments, useTodaysAppointmentCount } from '@/lib/hooks/useTodaysAppointments'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function RightSidebar() {
  const { data: todaysAppointments = [], isLoading: appointmentsLoading } = useTodaysAppointments()
  const { data: todaysCount = 0, isLoading: countLoading } = useTodaysAppointmentCount()
  return (
    <div className="space-y-6">
      {/* Setup Progress Card */}
      <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-2xl p-6 text-white shadow-lg border border-purple-200/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-purple-500 text-sm font-bold">3</span>
            </div>
          </div>
          <span className="text-sm font-medium">3/5</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold mb-2">Salon instellen</h3>
          <p className="text-sm text-purple-100 mb-4">Voeg je diensten en personeel toe</p>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-purple-100 transition-all duration-300 transform hover:scale-105">
            <span>Doorgaan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-2xl shadow-lg border border-blue-100/50 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/10 to-indigo-200/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-purple-200/10 to-pink-200/10 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="font-bold text-blue-700 text-sm tracking-wider uppercase">VANDAAG</h3>
          <ChevronRight className="w-5 h-5 text-blue-400 hover:text-blue-600 transition-colors" />
        </div>
        
        <div className="mb-4 relative z-10">
          <p className="text-sm text-blue-600/70 mb-2 font-medium">Afspraken vandaag</p>
          {countLoading ? (
            <div className="h-8 w-12 bg-blue-200/30 rounded-xl animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{todaysCount}</p>
          )}
        </div>
        
        <div className="relative z-10">
          {appointmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-blue-200/30 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-blue-200/30 rounded-lg mb-1"></div>
                    <div className="h-3 w-24 bg-blue-200/20 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : todaysAppointments.length > 0 ? (
            <div className="space-y-3">
              {todaysAppointments.slice(0, 3).map((appointment, index) => {
                const iconColors = [
                  { bg: 'bg-gradient-to-br from-blue-100 to-indigo-100/80', icon: 'text-blue-600', Icon: Clock },
                  { bg: 'bg-gradient-to-br from-purple-100 to-pink-100/80', icon: 'text-purple-600', Icon: Scissors },
                  { bg: 'bg-gradient-to-br from-rose-100 to-pink-100/80', icon: 'text-rose-600', Icon: User }
                ]
                const colorSet = iconColors[index % iconColors.length]
                const time = format(new Date(appointment.scheduled_at), 'HH:mm', { locale: nl })
                
                return (
                  <div key={appointment.id} className="flex items-center gap-3 hover:bg-white/50 rounded-xl p-2 -m-2 transition-all duration-200">
                    <div className={`w-8 h-8 ${colorSet.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                      <colorSet.Icon className={`w-4 h-4 ${colorSet.icon}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{time} - {appointment.service_name}</p>
                      <p className="text-xs text-gray-600">{appointment.client_name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-blue-500/70">Geen afspraken vandaag</p>
            </div>
          )}
        </div>
        
        <button className="w-full mt-4 bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg relative z-10">
          Bekijk agenda
        </button>
      </div>

      {/* Staff Alerts */}
      <div className="bg-gradient-to-br from-white via-rose-50/30 to-pink-50/40 rounded-2xl shadow-lg border border-rose-100/50 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-200/10 to-pink-200/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-purple-200/10 to-pink-200/10 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="font-bold text-rose-700 text-sm tracking-wider uppercase">PERSONEEL</h3>
          <ChevronRight className="w-5 h-5 text-rose-400 hover:text-rose-600 transition-colors" />
        </div>
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3 hover:bg-white/50 rounded-xl p-2 -m-2 transition-all duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-green-100/80 rounded-xl flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Maria - Beschikbaar</p>
              <p className="text-xs text-gray-600">{Math.floor(todaysCount * 0.6)} afspraken vandaag</p>
            </div>
          </div>
          <div className="flex items-center gap-3 hover:bg-white/50 rounded-xl p-2 -m-2 transition-all duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100/80 rounded-xl flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-amber-500 rounded-full shadow-sm"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Sophie - Pauze</p>
              <p className="text-xs text-gray-600">Tot 15:00</p>
            </div>
          </div>
          <div className="flex items-center gap-3 hover:bg-white/50 rounded-xl p-2 -m-2 transition-all duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-rose-100/80 rounded-xl flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Kim - Afwezig</p>
              <p className="text-xs text-gray-600">Ziek gemeld</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}