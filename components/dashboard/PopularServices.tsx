"use client"

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { usePopularServices } from '@/lib/hooks/usePopularServices'

export function PopularServices() {
  const [period, setPeriod] = useState<'month' | 'week'>('month')

  const today = new Date()
  const from = period === 'month' ? new Date(today.getFullYear(), today.getMonth(), 1) : new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
  const { data: services = [], isLoading } = usePopularServices(from, today)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Populaire diensten</h2>
        
        <div className="relative">
          <button
            onClick={() => setPeriod((p) => (p === 'month' ? 'week' : 'month'))}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 min-h-[36px]"
          >
            {period === 'month' ? 'Deze maand' : 'Deze week'}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="h-4 w-24 bg-gray-200 rounded" />
                <span className="h-4 w-8 bg-gray-200 rounded" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <p className="text-sm text-gray-500">Nog geen data voor deze periode</p>
      ) : (
        <div className="space-y-6">
          {services.map((service, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {service.service_name}
                </span>
                <span className="text-sm text-gray-600">
                  {service.percentage}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${service.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}