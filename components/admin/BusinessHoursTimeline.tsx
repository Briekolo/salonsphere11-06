'use client';

import { Clock, Coffee } from 'lucide-react';

interface BreakTime {
  start: string;
  end: string;
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
  breaks?: BreakTime[];
}

interface BusinessHoursTimelineProps {
  hours: {
    monday: DayHours;
    tuesday: DayHours;
    wednesday: DayHours;
    thursday: DayHours;
    friday: DayHours;
    saturday: DayHours;
    sunday: DayHours;
  };
}

const dayNames = {
  monday: 'Ma',
  tuesday: 'Di',
  wednesday: 'Wo',
  thursday: 'Do',
  friday: 'Vr',
  saturday: 'Za',
  sunday: 'Zo'
};

export function BusinessHoursTimeline({ hours }: BusinessHoursTimelineProps) {
  // Convert time string to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes to percentage of day (0-100%)
  const minutesToPercentage = (minutes: number): number => {
    return (minutes / (24 * 60)) * 100;
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5); // Remove seconds if present
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Weekoverzicht</h3>
      </div>

      <div className="space-y-4">
        {/* Time scale */}
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          <div className="h-1 bg-gray-100 rounded relative">
            {[0, 6, 12, 18, 24].map(hour => (
              <div
                key={hour}
                className="absolute top-0 w-px h-1 bg-gray-300"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Days */}
        {(Object.keys(dayNames) as Array<keyof typeof dayNames>).map((day) => {
          const dayHours = hours[day];
          
          return (
            <div key={day} className="flex items-center gap-4">
              <div className="w-8 text-sm font-medium text-gray-700">
                {dayNames[day]}
              </div>
              
              <div className="flex-1 relative h-8 bg-gray-50 rounded-lg">
                {!dayHours.closed ? (
                  <>
                    {/* Open hours bar */}
                    <div
                      className="absolute top-1 bottom-1 bg-primary-200 rounded"
                      style={{
                        left: `${minutesToPercentage(timeToMinutes(dayHours.open))}%`,
                        width: `${
                          minutesToPercentage(timeToMinutes(dayHours.close)) -
                          minutesToPercentage(timeToMinutes(dayHours.open))
                        }%`
                      }}
                    />
                    
                    {/* Break times */}
                    {dayHours.breaks?.map((breakTime, index) => (
                      <div
                        key={index}
                        className="absolute top-1 bottom-1 bg-orange-200 rounded flex items-center justify-center"
                        style={{
                          left: `${minutesToPercentage(timeToMinutes(breakTime.start))}%`,
                          width: `${
                            minutesToPercentage(timeToMinutes(breakTime.end)) -
                            minutesToPercentage(timeToMinutes(breakTime.start))
                          }%`
                        }}
                        title={`Pauze: ${formatTime(breakTime.start)} - ${formatTime(breakTime.end)}`}
                      >
                        <Coffee className="h-3 w-3 text-orange-600" />
                      </div>
                    ))}
                    
                    {/* Time labels */}
                    <div className="absolute -bottom-5 text-xs text-gray-600 flex justify-between w-full">
                      <span
                        className="absolute"
                        style={{ left: `${minutesToPercentage(timeToMinutes(dayHours.open))}%` }}
                      >
                        {formatTime(dayHours.open)}
                      </span>
                      <span
                        className="absolute"
                        style={{ 
                          left: `${minutesToPercentage(timeToMinutes(dayHours.close))}%`,
                          transform: 'translateX(-100%)'
                        }}
                      >
                        {formatTime(dayHours.close)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                    Gesloten
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-200 rounded"></div>
          <span>Open</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 rounded flex items-center justify-center">
            <Coffee className="h-2 w-2 text-orange-600" />
          </div>
          <span>Pauze</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 rounded border"></div>
          <span>Gesloten</span>
        </div>
      </div>
    </div>
  );
}