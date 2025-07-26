'use client'

interface CalendarSkeletonProps {
  isMobile?: boolean
}

export function CalendarSkeleton({ isMobile = false }: CalendarSkeletonProps) {
  const days = isMobile ? 7 : 14
  
  return (
    <div className="h-full bg-gray-50 animate-pulse">
      <div className={`${isMobile ? 'flex flex-col' : 'grid grid-cols-7 lg:grid-cols-14'} gap-1 p-2`}>
        {Array.from({ length: days }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg p-3">
            {/* Day Header Skeleton */}
            <div className="mb-3">
              <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
              <div className="h-6 w-8 bg-gray-300 rounded"></div>
            </div>
            
            {/* Event Skeletons */}
            <div className="space-y-2">
              {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, eventIndex) => (
                <div key={eventIndex} className="bg-gray-100 rounded-lg p-3">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}