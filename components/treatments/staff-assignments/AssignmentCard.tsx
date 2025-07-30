'use client'

import { useState } from 'react'
import { Check, Clock, Euro, Edit3, X } from 'lucide-react'
import type { StaffService } from '@/lib/hooks/useStaffServices'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  category?: string
}

interface AssignmentCardProps {
  service: Service
  assignment?: StaffService
  onToggle: () => void
  onUpdate: (updates: Partial<StaffService>) => void
  compact?: boolean
}

export function AssignmentCard({ 
  service, 
  assignment, 
  onToggle, 
  onUpdate, 
  compact = false 
}: AssignmentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  
  const handleSave = () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (compact) {
    return (
      <div className={`
        flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer
        ${assignment 
          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }
      `}
      onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-5 h-5 rounded flex items-center justify-center
            ${assignment ? 'bg-green-500' : 'border-2 border-gray-300'}
          `}>
            {assignment && <Check className="w-3 h-3 text-white" />}
          </div>
          <div>
            <div className="font-medium text-sm">{service.name}</div>
            <div className="text-xs text-gray-500">
              {service.duration_minutes}min • €{service.price}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`
      p-4 rounded-lg border-2 transition-all
      ${assignment 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
      }
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {assignment?.custom_duration_minutes || service.duration_minutes}min
            </div>
            <div className="flex items-center gap-1">
              <Euro className="w-4 h-4" />
              {assignment?.custom_price || service.price}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {assignment && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-white/80 rounded"
            >
              <Edit3 className="w-4 h-4 text-gray-500" />
            </button>
          )}
          
          <button
            onClick={onToggle}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${assignment 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-white border-2 border-gray-300 hover:border-green-300 text-gray-400'
              }
            `}
          >
            {assignment ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
          </button>
        </div>
      </div>


      {isEditing && assignment && (
        <div className="mt-4 p-3 bg-white rounded-lg border space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aangepaste duur (minuten)
            </label>
            <input
              type="number"
              value={assignment.custom_duration_minutes || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null
                // Round to nearest 15 minutes if value is provided
                const roundedValue = value ? Math.round(value / 15) * 15 : null
                onUpdate({ custom_duration_minutes: roundedValue })
              }}
              placeholder={`Standaard: ${service.duration_minutes}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              min="15"
              step="15"
            />
            <p className="text-xs text-gray-500 mt-1">Veelvouden van 15 minuten</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aangepaste prijs (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={assignment.custom_price || ''}
              onChange={(e) => onUpdate({ 
                custom_price: e.target.value ? parseFloat(e.target.value) : null 
              })}
              placeholder={`Standaard: €${service.price}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}