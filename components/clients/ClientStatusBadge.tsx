'use client'

import { ClientStatus, ClientStatusService } from '@/lib/services/clientStatusService'
import { cn } from '@/lib/utils'

interface ClientStatusBadgeProps {
  status: ClientStatus
  className?: string
  showTooltip?: boolean
}

export function ClientStatusBadge({ status, className, showTooltip = false }: ClientStatusBadgeProps) {
  const config = ClientStatusService.getStatusConfig(status)

  if (showTooltip) {
    return (
      <div className="relative group">
        <span
          className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            config.color,
            className
          )}
        >
          {config.label}
        </span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}