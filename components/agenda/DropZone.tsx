'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

interface DropZoneProps {
  date: Date
  timeLabel: string
  onDrop: (date: Date) => void
  onClick: () => void
  isDragActive?: boolean
  hasConflict?: boolean
}

export function DropZone({ 
  date, 
  timeLabel, 
  onDrop, 
  onClick,
  isDragActive = false,
  hasConflict = false
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDragActive) return
    setIsDragOver(true)
  }
  
  const handleDragLeave = () => {
    setIsDragOver(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!hasConflict) {
      onDrop(date)
    }
  }
  
  return (
    <button
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex-1 p-3 rounded-lg transition-all duration-200
        min-h-[60px] flex items-center justify-center
        ${isDragActive && !hasConflict 
          ? isDragOver 
            ? 'border-2 border-blue-500 bg-blue-50' 
            : 'border-2 border-dashed border-blue-300 bg-blue-50/50'
          : 'border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
        ${hasConflict && isDragActive 
          ? 'border-2 border-dashed border-red-300 bg-red-50/50 cursor-not-allowed' 
          : ''
        }
      `}
    >
      {/* Time preview tooltip when dragging */}
      {isDragOver && isDragActive && !hasConflict && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50">
          {timeLabel}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
      
      {/* Drop zone content */}
      <div className={`
        flex items-center gap-2 text-sm
        ${isDragActive 
          ? hasConflict 
            ? 'text-red-500' 
            : isDragOver 
              ? 'text-blue-600 font-medium' 
              : 'text-blue-500'
          : 'text-gray-500'
        }
      `}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isDragActive 
            ? hasConflict 
              ? 'Tijdslot bezet' 
              : isDragOver 
                ? 'Laat los om te verplaatsen' 
                : 'Sleep hier'
            : 'Afspraak toevoegen'
          }
        </span>
      </div>
      
      {/* Visual snap indicators */}
      {isDragActive && !hasConflict && (
        <>
          <div className="absolute top-0 left-0 right-0 h-px bg-blue-300" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-300" />
        </>
      )}
    </button>
  )
}