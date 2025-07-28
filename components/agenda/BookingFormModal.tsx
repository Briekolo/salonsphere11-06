'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2, Calendar, Clock, User, Briefcase, FileText, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCreateBooking, useUpdateBooking, useDeleteBooking, useBooking } from '@/lib/hooks/useBookings'
import { useClients } from '@/lib/hooks/useClients'
import { useServices } from '@/lib/hooks/useServices'
import { useUsers } from '@/lib/hooks/useUsers'
import { useAvailableStaff } from '@/lib/hooks/useAvailableStaff'
import { StaffMember, StaffService } from '@/types/staff'
import { debugLog, debugError } from '@/lib/utils/debug'

interface BookingFormModalProps {
  bookingId?: string | null
  initialDate?: Date
  onClose: () => void
}

export function BookingFormModal({ bookingId, initialDate, onClose }: BookingFormModalProps) {
  // Helper: rond tijd af op 15 minuten
  const roundToQuarterHour = (date: Date) => {
    const rounded = new Date(date)
    const minutes = rounded.getMinutes()
    const roundedMinutes = Math.round(minutes / 15) * 15
    rounded.setMinutes(roundedMinutes)
    rounded.setSeconds(0)
    rounded.setMilliseconds(0)
    return rounded
  }

  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    user_id: '', // staff member
    scheduled_at: initialDate ? roundToQuarterHour(initialDate).toISOString() : roundToQuarterHour(new Date()).toISOString(),
    status: 'scheduled', // Default to scheduled for new appointments
    notes: '',
    duration_minutes: 60, // Default duration
  })
  
  // Debug log to check if initialDate has the right time
  useEffect(() => {
    if (initialDate) {
      debugLog('Initial date with time:', initialDate)
    }
  }, [initialDate])

  const isEditing = Boolean(bookingId)

  // Data fetching hooks
  const { data: clients = [], isLoading: isLoadingClients } = useClients()
  const { data: services = [], isLoading: isLoadingServices } = useServices()
  const { data: existingBooking, isLoading: isLoadingBooking } = useBooking(bookingId || null)
  
  // Use custom hook for available staff
  const { 
    availableStaff, 
    isLoading: isLoadingStaffServices,
    getStaffServiceAssignment,
    allStaff
  } = useAvailableStaff(formData.service_id)

  // Update duration when service changes (only for new bookings)
  useEffect(() => {
    if (!bookingId) {
      const selectedService = services.find(s => s.id === formData.service_id)
      if (selectedService && selectedService.duration_minutes) {
        setFormData(p => ({ ...p, duration_minutes: selectedService.duration_minutes as number }))
      }
    }
  }, [formData.service_id, services, bookingId])

  // Update duration and price when staff member changes
  useEffect(() => {
    if (formData.service_id && formData.user_id) {
      const serviceAssignment = getStaffServiceAssignment(formData.user_id, formData.service_id)
      const selectedService = services.find(s => s.id === formData.service_id)
      
      if (serviceAssignment && selectedService) {
        const updates: Partial<typeof formData> = {}
        
        // Use custom duration if set, otherwise use service default
        if (serviceAssignment.custom_duration_minutes) {
          updates.duration_minutes = serviceAssignment.custom_duration_minutes
        } else if (selectedService.duration_minutes) {
          updates.duration_minutes = selectedService.duration_minutes
        }
        
        // Update form if there are changes
        if (Object.keys(updates).length > 0) {
          setFormData(p => ({ ...p, ...updates }))
        }
      }
    }
  }, [formData.service_id, formData.user_id, getStaffServiceAssignment, services])

  // Populate form when editing an existing booking
  useEffect(() => {
    if (isEditing && existingBooking) {
      debugLog('Editing booking data:', existingBooking)
      const scheduledDate = existingBooking.scheduled_at ? roundToQuarterHour(new Date(existingBooking.scheduled_at)) : ''
      setFormData({
        client_id: existingBooking.client_id || '',
        service_id: existingBooking.service_id || '',
        user_id: existingBooking.staff_id || existingBooking.user_id || '', // Check both staff_id and user_id
        scheduled_at: scheduledDate ? scheduledDate.toISOString() : '',
        status: existingBooking.status || 'scheduled',
        notes: existingBooking.notes || '',
        duration_minutes: existingBooking.duration_minutes || 60,
      })
    }
  }, [isEditing, existingBooking])

  // Mutation hooks
  const createMutation = useCreateBooking()
  const updateMutation = useUpdateBooking()
  const deleteMutation = useDeleteBooking()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare payload - include all fields for update
      const payload: Record<string, any> = {
        client_id: formData.client_id,
        service_id: formData.service_id,
        scheduled_at: formData.scheduled_at,
        status: formData.status,
        notes: formData.notes,
        duration_minutes: formData.duration_minutes
      }

      // Add staff_id if a staff member is selected
      if (formData.user_id) {
        payload.staff_id = formData.user_id
      }

      debugLog('Submitting payload:', payload)

      if (isEditing) {
        if (!bookingId) return
        await updateMutation.mutateAsync({ id: bookingId, updates: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (error) {
      debugError('Failed to save booking:', error)
      // Optionally show a user-facing error message
    }
  }
  
  const handleDelete = async () => {
    if (!bookingId) return
    if(window.confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) {
      try {
        await deleteMutation.mutateAsync(bookingId)
        onClose()
      } catch (error) {
        debugError('Failed to delete booking:', error)
      }
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || isLoadingBooking;

  // Dynamic color theming based on appointment status
  const getStatusTheme = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100',
          headerBorder: 'border-emerald-200',
          accent: 'text-emerald-700',
          modalBorder: 'ring-2 ring-emerald-100'
        }
      case 'scheduled':
        return {
          headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100',
          headerBorder: 'border-amber-200',
          accent: 'text-amber-700',
          modalBorder: 'ring-2 ring-amber-100'
        }
      case 'completed':
        return {
          headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100',
          headerBorder: 'border-blue-200',
          accent: 'text-blue-700',
          modalBorder: 'ring-2 ring-blue-100'
        }
      case 'cancelled':
        return {
          headerBg: 'bg-gradient-to-r from-red-50 to-red-100',
          headerBorder: 'border-red-200',
          accent: 'text-red-700',
          modalBorder: 'ring-2 ring-red-100'
        }
      default:
        return {
          headerBg: 'bg-gradient-to-r from-white to-gray-50',
          headerBorder: 'border-gray-100',
          accent: 'text-gray-700',
          modalBorder: 'ring-2 ring-gray-100'
        }
    }
  }

  const statusTheme = getStatusTheme(formData.status)

  if (isLoadingBooking) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">Laden...</div>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] overflow-hidden ${statusTheme.modalBorder}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${statusTheme.headerBorder} flex-shrink-0 ${statusTheme.headerBg}`}>
          <div>
            <h2 className={`text-2xl font-semibold ${statusTheme.accent}`}>{isEditing ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</h2>
            <p className="text-sm text-gray-600 mt-1">{isEditing ? 'Pas de details van de afspraak aan' : 'Plan een nieuwe afspraak in'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content & Footer in één <form> zoals bij andere modals */}
        <form onSubmit={handleSubmit} className="contents">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* Client and Service Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  Klant
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData(p => ({...p, client_id: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                  required
                  disabled={isLoadingClients || isLoading}
                >
                  <option value="">{isLoadingClients ? 'Laden...' : 'Selecteer een klant'}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.first_name} {client.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  Behandeling
                </label>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={(e) => setFormData(p => ({...p, service_id: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                  required
                  disabled={isLoadingServices || isLoading}
                >
                  <option value="">{isLoadingServices ? 'Laden...' : 'Selecteer een behandeling'}</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Staff Member */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                Medewerker
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={(e) => {
                  debugLog('Staff selection changed to:', e.target.value)
                  setFormData(p => ({...p, user_id: e.target.value}))
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                disabled={isLoadingStaffServices || isLoading}
              >
                <option value="">{isLoadingStaffServices ? 'Laden...' : 'Selecteer een medewerker'}</option>
                {availableStaff.map((member: StaffMember) => {
                  const label = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() || member.email || 'Onbekende medewerker'
                  const serviceAssignment = member.services.find((s: StaffService) => s.service_id === formData.service_id)
                  const proficiencyLabel = serviceAssignment?.proficiency_level || 'standaard'
                  return (
                    <option key={member.id} value={member.id}>
                      {label} ({proficiencyLabel})
                    </option>
                  )
                })}
              </select>
              {formData.service_id && availableStaff.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2">
                    <strong>Geen medewerkers beschikbaar</strong> voor deze behandeling.
                  </p>
                  <p className="text-xs text-amber-700 mb-3">
                    U moet eerst medewerkers toewijzen aan deze behandeling voordat u afspraken kunt inplannen.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link 
                      href="/treatments" 
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                    >
                      Ga naar Behandelingen
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="text-xs text-amber-600">→ Medewerker toewijzingen tabblad</span>
                  </div>
                </div>
              )}
              {isEditing && !formData.user_id && availableStaff.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Let op: Deze afspraak heeft geen medewerker toegewezen
                </p>
              )}
            </div>
            {/* Date and Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                Datum & Tijd
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Date input */}
                <div className="relative">
                  <input 
                    type="date"
                    value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const currentTime = new Date(formData.scheduled_at)
                      const newDate = new Date(e.target.value)
                      newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0)
                      setFormData(p => ({...p, scheduled_at: newDate.toISOString()}))
                    }}
                    className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                    required
                    disabled={isLoading}
                  />
                  <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Time dropdown */}
                <div className="relative">
                  <select
                    value={(() => {
                      const date = new Date(formData.scheduled_at)
                      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                    })()}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number)
                      const newDate = new Date(formData.scheduled_at)
                      newDate.setHours(hours, minutes, 0, 0)
                      setFormData(p => ({...p, scheduled_at: newDate.toISOString()}))
                    }}
                    className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                    required
                    disabled={isLoading}
                  >
                    {/* Generate time options from 7:00 to 22:00 in 15-minute intervals */}
                    {Array.from({ length: 61 }, (_, i) => {
                      const totalMinutes = 420 + (i * 15) // Start at 7:00 (420 minutes)
                      const hours = Math.floor(totalMinutes / 60)
                      const minutes = totalMinutes % 60
                      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                      return (
                        <option key={timeString} value={timeString}>
                          {timeString}
                        </option>
                      )
                    })}
                  </select>
                  <Clock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                Duur
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(p => ({...p, duration_minutes: parseInt(e.target.value) || 60}))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                    disabled={isLoading}
                  />
                  <span className="absolute right-4 top-3.5 text-sm text-gray-500 pointer-events-none">min</span>
                </div>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600">
                    Eindtijd: {formData.scheduled_at && formData.duration_minutes ? 
                      new Date(new Date(formData.scheduled_at).getTime() + formData.duration_minutes * 60000)
                        .toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) 
                      : '--:--'
                    }
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Standaard duur: {services.find(s => s.id === formData.service_id)?.duration_minutes || '--'} minuten
              </div>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'confirmed', label: 'Bevestigd', color: 'bg-green-100 text-green-800 border-green-200' },
                  { value: 'scheduled', label: 'Ingepland', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { value: 'completed', label: 'Voltooid', color: 'bg-gray-100 text-gray-800 border-gray-200' },
                  { value: 'cancelled', label: 'Geannuleerd', color: 'bg-red-100 text-red-800 border-red-200' }
                ].map(status => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setFormData(p => ({...p, status: status.value}))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      formData.status === status.value 
                        ? status.color 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    disabled={isLoading}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 text-gray-400" />
                Notities
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all resize-none"
                rows={3}
                placeholder="Voeg optionele notities toe..."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
            <div>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  disabled={isLoading} 
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Verwijderen</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={isLoading} 
                className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-all font-medium"
              >
                Annuleren
              </button>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="flex items-center gap-2 px-6 py-2.5 bg-[#02011F] text-white rounded-xl hover:bg-opacity-90 transition-all font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Bezig...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Wijzigingen opslaan' : 'Afspraak inplannen'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 