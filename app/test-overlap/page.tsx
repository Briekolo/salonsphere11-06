'use client'

import { calculateAppointmentPositions, appointmentsOverlap } from '@/lib/utils/appointment-overlap'

export default function TestOverlapPage() {
  // Test appointments that should overlap
  const testAppointments = [
    {
      id: '1',
      scheduled_at: '2025-01-30T09:00:00',
      duration_minutes: 60,
    },
    {
      id: '2',
      scheduled_at: '2025-01-30T09:30:00',
      duration_minutes: 60,
    },
    {
      id: '3',
      scheduled_at: '2025-01-30T09:15:00',
      duration_minutes: 30,
    }
  ]

  // Test overlap detection
  const overlaps12 = appointmentsOverlap(testAppointments[0], testAppointments[1])
  const overlaps13 = appointmentsOverlap(testAppointments[0], testAppointments[2])
  const overlaps23 = appointmentsOverlap(testAppointments[1], testAppointments[2])

  // Calculate positions
  const appointmentsWithPositions = calculateAppointmentPositions(testAppointments)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Overlap Detection Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test Appointments:</h2>
        <ul className="list-disc pl-5">
          <li>Appointment 1: 09:00 - 10:00 (60 min)</li>
          <li>Appointment 2: 09:30 - 10:30 (60 min)</li>
          <li>Appointment 3: 09:15 - 09:45 (30 min)</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Overlap Detection Results:</h2>
        <ul className="list-disc pl-5">
          <li>1 overlaps with 2: {overlaps12 ? 'YES' : 'NO'}</li>
          <li>1 overlaps with 3: {overlaps13 ? 'YES' : 'NO'}</li>
          <li>2 overlaps with 3: {overlaps23 ? 'YES' : 'NO'}</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Calculated Positions:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(appointmentsWithPositions, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Visual Representation:</h2>
        <div className="border border-gray-300 p-4">
          <div className="relative h-32 bg-gray-50">
            {appointmentsWithPositions.map((apt) => {
              const position = apt.position!
              return (
                <div
                  key={apt.id}
                  className="absolute top-0 bottom-0 bg-blue-200 border border-blue-400 p-2"
                  style={{
                    left: `${position.left}%`,
                    width: `${position.width}%`,
                  }}
                >
                  Apt {apt.id}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}