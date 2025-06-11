'use client'

import { Clock, Wifi, WifiOff } from 'lucide-react'

interface RefreshClockProps {
  lastUpdate: Date
  autoRefresh: boolean
}

export function RefreshClock({ lastUpdate, autoRefresh }: RefreshClockProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTimeSinceUpdate = () => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconden geleden`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} geleden`
    } else {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? 'uur' : 'uren'} geleden`
    }
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Laatste update: {formatTime(lastUpdate)}
          </span>
        </div>
        
        <div className="w-px h-4 bg-gray-300" />
        
        <div className="flex items-center gap-2">
          {autoRefresh ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">
            {autoRefresh ? 'Live updates' : 'Handmatig'}
          </span>
        </div>
        
        <div className="w-px h-4 bg-gray-300" />
        
        <span className="text-xs text-gray-500">
          {getTimeSinceUpdate()}
        </span>
      </div>
    </div>
  )
}