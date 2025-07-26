'use client'

import { ArrowRight } from 'lucide-react'
import { useTenantMetrics } from '@/lib/hooks/useTenantMetrics'

export function HeroSection() {
  const { data: metrics, isLoading } = useTenantMetrics()

  if (isLoading) {
    return (
      <div className="bg-white p-12 animate-pulse">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-16">
            <div className="text-center">
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="h-12 w-24 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="h-12 w-24 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="h-12 w-24 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const revenue = metrics?.revenue_last30 ?? 0
  const appointments = metrics?.appointments_last30 ?? 0
  const avgValue = appointments > 0 ? Math.round(revenue / appointments) : 0

  return (
    <div className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Clean metric cards layout like Origin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
          {/* Monthly Revenue */}
          <div className="text-center cursor-pointer group">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-sm font-medium text-gray-600">Maand omzet</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <div className="text-4xl font-light text-gray-900 mb-2">
              €{revenue.toLocaleString('nl-NL')}
            </div>
            <div className="text-sm text-gray-500">totaal deze maand</div>
          </div>

          {/* Appointments */}
          <div className="text-center cursor-pointer group">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-sm font-medium text-gray-600">Afspraken</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <div className="text-4xl font-light text-gray-900 mb-2">
              {appointments}
            </div>
            <div className="text-sm text-gray-500">deze maand</div>
          </div>

          {/* Average Value */}
          <div className="text-center cursor-pointer group">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-sm font-medium text-gray-600">Gemiddelde waarde</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <div className="text-4xl font-light text-gray-900 mb-2">
              €{avgValue}
            </div>
            <div className="text-sm text-gray-500">per afspraak</div>
          </div>
        </div>

        {/* Clean divider */}
        <div className="border-t border-gray-200 mb-16"></div>

        {/* Simple summary section */}
        <div className="text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-4">
            Salon prestaties overzicht
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Je salon draait goed deze maand met een sterke omzetgroei en tevreden klanten.
          </p>
        </div>
      </div>
    </div>
  )
}