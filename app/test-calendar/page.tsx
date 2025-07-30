'use client'

import { useState } from 'react'
import { CalendarView } from '@/components/agenda/CalendarView'

export default function TestCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Calendar Test Page</h1>
      <p className="mb-4 text-gray-600">
        To test overlap: Create multiple appointments at the same time (e.g., 9:00, 9:15, 9:30)
      </p>
      <div className="max-w-6xl">
        <CalendarView 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>
    </div>
  )
}