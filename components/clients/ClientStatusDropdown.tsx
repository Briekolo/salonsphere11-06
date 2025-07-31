'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, UserCheck, UserX, Crown, UserPlus, Eye, Edit, Trash2 } from 'lucide-react'
import { ClientStatus } from '@/lib/services/clientStatusService'

interface ClientStatusDropdownProps {
  clientId: string
  currentStatus: ClientStatus
  onStatusChange?: (clientId: string, newStatus: ClientStatus) => void
  onViewClient?: (clientId: string) => void
  onEditClient?: (clientId: string) => void  
  onDeleteClient?: (clientId: string) => void
}

export function ClientStatusDropdown({ 
  clientId, 
  currentStatus, 
  onStatusChange, 
  onViewClient,
  onEditClient,
  onDeleteClient 
}: ClientStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleStatusChange = (newStatus: ClientStatus) => {
    onStatusChange?.(clientId, newStatus)
    setIsOpen(false)
  }

  const statusOptions = [
    { 
      value: 'active' as ClientStatus, 
      label: 'Actief', 
      icon: <UserCheck className="w-4 h-4" />,
      description: 'Client met recente activiteit'
    },
    { 
      value: 'inactive' as ClientStatus, 
      label: 'Inactief', 
      icon: <UserX className="w-4 h-4" />,
      description: 'Client zonder recente activiteit'
    },
    { 
      value: 'new' as ClientStatus, 
      label: 'Nieuw', 
      icon: <UserPlus className="w-4 h-4" />,
      description: 'Nieuwe client'
    },
    { 
      value: 'vip' as ClientStatus, 
      label: 'VIP', 
      icon: <Crown className="w-4 h-4" />,
      description: 'Waardevolle client'
    }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Status Section */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Status wijzigen
            </div>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(option.value)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors ${
                  currentStatus === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {option.icon}
                <div className="flex-1 text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
                {currentStatus === option.value && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100" />

          {/* Actions Section */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Acties
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewClient?.(clientId)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Bekijken</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditClient?.(clientId)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Bewerken</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClient?.(clientId)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Verwijderen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}