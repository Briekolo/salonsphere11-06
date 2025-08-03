'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Pause, Play, X } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useSeriesBookings, useCancelTreatmentSeries, usePauseTreatmentSeries, useResumeTreatmentSeries } from '@/lib/hooks/useTreatmentSeries'
import { TreatmentSeriesWithDetails } from '@/lib/services/treatmentSeriesService'

interface TreatmentSeriesCardProps {
  series: TreatmentSeriesWithDetails
  onRefresh?: () => void
}

export function TreatmentSeriesCard({ series, onRefresh }: TreatmentSeriesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: bookings, isLoading: isLoadingBookings } = useSeriesBookings(series.id)
  const cancelMutation = useCancelTreatmentSeries()
  const pauseMutation = usePauseTreatmentSeries()
  const resumeMutation = useResumeTreatmentSeries()

  const progress = series.total_sessions > 0 
    ? (series.completed_sessions / series.total_sessions) * 100 
    : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const handleCancel = async () => {
    if (window.confirm('Weet je zeker dat je deze behandelreeks wilt annuleren? Alle geplande afspraken worden geannuleerd.')) {
      await cancelMutation.mutateAsync(series.id)
      onRefresh?.()
    }
  }

  const handlePause = async () => {
    await pauseMutation.mutateAsync(series.id)
    onRefresh?.()
  }

  const handleResume = async () => {
    await resumeMutation.mutateAsync(series.id)
    onRefresh?.()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{series.service_name}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {series.total_sessions} sessies • {series.staff_name || 'Geen medewerker toegewezen'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(series.status)}`}>
            {getStatusIcon(series.status)}
            {series.status === 'active' ? 'Actief' : 
             series.status === 'completed' ? 'Voltooid' :
             series.status === 'cancelled' ? 'Geannuleerd' : 'Gepauzeerd'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Voortgang</span>
            <span className="text-gray-900 font-medium">
              {series.completed_sessions} van {series.total_sessions} voltooid
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                series.status === 'completed' ? 'bg-green-600' :
                series.status === 'cancelled' ? 'bg-red-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Price and Discount */}
        {series.package_discount_percentage && series.package_discount_percentage > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
            <p className="text-sm text-green-800">
              {series.package_discount_percentage}% pakketkorting toegepast
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Totaalprijs</span>
          <span className="font-medium">€{series.total_price}</span>
        </div>

        {series.next_appointment_date && series.status === 'active' && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Volgende afspraak:</span>
            <span className="font-medium">
              {format(new Date(series.next_appointment_date), 'd MMM yyyy HH:mm', { locale: nl })}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Minder tonen' : 'Details tonen'}
          </button>

          {series.status === 'active' && (
            <>
              <button
                onClick={handlePause}
                disabled={pauseMutation.isPending}
                className="ml-auto text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
              >
                <Pause className="w-4 h-4" />
                Pauzeren
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
            </>
          )}

          {series.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={resumeMutation.isPending}
              className="ml-auto text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              Hervatten
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h5 className="font-medium text-gray-900 mb-3">Afspraken in deze reeks</h5>
          
          {isLoadingBookings ? (
            <div className="text-center py-4 text-gray-600">Laden...</div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                    booking.status === 'completed' ? 'border-green-200' :
                    booking.status === 'cancelled' ? 'border-red-200' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Sessie {booking.series_session_number} van {series.total_sessions}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(booking.scheduled_at), 'd MMM yyyy HH:mm', { locale: nl })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.is_paid && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Betaald</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status === 'completed' ? 'Voltooid' :
                       booking.status === 'cancelled' ? 'Geannuleerd' :
                       booking.status === 'confirmed' ? 'Bevestigd' :
                       booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Geen afspraken gevonden</p>
          )}

          {series.notes && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notitie:</strong> {series.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}