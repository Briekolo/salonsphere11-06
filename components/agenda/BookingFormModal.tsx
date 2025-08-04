'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { X, Save, Trash2, Calendar, Clock, User, Briefcase, FileText, Users, ExternalLink, Euro, AlertCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { useCreateBooking, useUpdateBooking, useDeleteBooking, useBooking } from '@/lib/hooks/useBookings'
import { useClients } from '@/lib/hooks/useClients'
import { useServices } from '@/lib/hooks/useServices'
import { useUsers } from '@/lib/hooks/useUsers'
import { useAvailableStaff } from '@/lib/hooks/useAvailableStaff'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { StaffMember, StaffService } from '@/types/staff'
import { debugLog, debugError } from '@/lib/utils/debug'
import { useClientTreatmentSeries } from '@/lib/hooks/useTreatmentSeries'
import { getEarliestOpenTime, getLatestCloseTime, timeToMinutes, isTimeWithinBusinessHours } from '@/lib/utils/business-hours'
// Dynamically import to prevent circular dependency
const CreateTreatmentSeriesModal = lazy(() => import('@/components/treatments/CreateTreatmentSeriesModal').then(module => ({
  default: module.CreateTreatmentSeriesModal || module.default
})))

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
    notes: '',
    duration_minutes: 60, // Default duration
  })
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCustomDuration, setIsCustomDuration] = useState(false) // Track if user wants custom duration
  const [showTreatmentSeriesModal, setShowTreatmentSeriesModal] = useState(false)
  const [showSeriesAlert, setShowSeriesAlert] = useState(false)
  
  const hasInitialized = useRef(false)
  const isInitializingRef = useRef(false)
  
  // Debug log to check if initialDate has the right time
  useEffect(() => {
    if (initialDate) {
      debugLog('Initial date with time:', initialDate)
    }
  }, [initialDate])

  const isEditing = Boolean(bookingId)

  // Generate available time slots based on business hours
  const getAvailableTimeSlots = () => {
    if (!businessHours || !formData.scheduled_at) {
      // Fallback to default hours (7:00 - 22:00) if no business hours loaded
      return Array.from({ length: 61 }, (_, i) => {
        const totalMinutes = 420 + (i * 15) // Start at 7:00 (420 minutes)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        return { value: timeString, label: timeString, disabled: false }
      })
    }

    const selectedDate = new Date(formData.scheduled_at)
    const dayOfWeek = selectedDate.getDay()
    
    // Check if the selected day is within business hours
    const isWithinBusiness = isTimeWithinBusinessHours(businessHours, dayOfWeek, '12:00') // Check if day is open at all
    
    if (!isWithinBusiness) {
      // If the salon is closed on this day, show all times but disabled
      return Array.from({ length: 61 }, (_, i) => {
        const totalMinutes = 420 + (i * 15)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        return { value: timeString, label: `${timeString} (Gesloten)`, disabled: true }
      })
    }

    // Get the earliest and latest times across all days for the full range
    const earliestOpen = getEarliestOpenTime(businessHours)
    const latestClose = getLatestCloseTime(businessHours)
    
    const startMinutes = Math.max(420, timeToMinutes(earliestOpen) - 60) // Start 1 hour before earliest, but not before 7:00
    const endMinutes = Math.min(1320, timeToMinutes(latestClose) + 60) // End 1 hour after latest, but not after 22:00
    
    const totalSlots = Math.ceil((endMinutes - startMinutes) / 15)
    
    return Array.from({ length: totalSlots }, (_, i) => {
      const totalMinutes = startMinutes + (i * 15)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      
      // Check if this specific time is within business hours for the selected day
      const isTimeAvailable = isTimeWithinBusinessHours(businessHours, dayOfWeek, timeString)
      
      return {
        value: timeString,
        label: isTimeAvailable ? timeString : `${timeString} (Buiten openingstijden)`,
        disabled: !isTimeAvailable
      }
    })
  }

  // Data fetching hooks
  const { data: clients = [], isLoading: isLoadingClients } = useClients()
  const { data: services = [], isLoading: isLoadingServices } = useServices()
  const { data: existingBooking, isLoading: isLoadingBooking } = useBooking(bookingId || null)
  const { data: clientTreatmentSeries = [] } = useClientTreatmentSeries(formData.client_id)
  const { businessHours, isLoading: isLoadingBusinessHours } = useBusinessHours()
  
  // Use custom hook for available staff
  const { 
    availableStaff, 
    isLoading: isLoadingStaffServices,
    getStaffServiceAssignment,
    allStaff
  } = useAvailableStaff(formData.service_id)

  // Update duration when service changes (only for new bookings, not during initialization, and not when custom duration is set)
  useEffect(() => {
    if (!bookingId && !isInitializingRef.current && !isCustomDuration && formData.service_id) {
      const selectedService = services.find(s => s.id === formData.service_id)
      if (selectedService && selectedService.duration_minutes && selectedService.duration_minutes !== formData.duration_minutes) {
        setFormData(p => ({ ...p, duration_minutes: selectedService.duration_minutes as number }))
      }
    }
  }, [formData.service_id, formData.duration_minutes, services, bookingId, isCustomDuration])

  // Update duration and price when staff member changes (only for manual changes, not during initialization, and not when custom duration is set)
  useEffect(() => {
    // Skip during initialization or when custom duration is set
    if (isInitializingRef.current || isCustomDuration || !formData.service_id || !formData.user_id) {
      return
    }

    const serviceAssignment = getStaffServiceAssignment(formData.user_id, formData.service_id)
    const selectedService = services.find(s => s.id === formData.service_id)
    
    if (serviceAssignment && selectedService) {
      const newDuration = serviceAssignment.custom_duration_minutes || selectedService.duration_minutes
      
      // Only update if duration actually changed
      if (newDuration && newDuration !== formData.duration_minutes) {
        setFormData(p => ({ ...p, duration_minutes: newDuration as number }))
      }
    }
  }, [formData.service_id, formData.user_id, formData.duration_minutes, getStaffServiceAssignment, services, isCustomDuration])

  // Check for active treatment series when client changes
  useEffect(() => {
    if (formData.client_id && clientTreatmentSeries.length > 0 && !isEditing) {
      // Check if any active series have remaining sessions
      const activeSeries = clientTreatmentSeries.filter(series => 
        series.status === 'active' && 
        series.completed_sessions < series.total_sessions
      )
      
      if (activeSeries.length > 0) {
        setShowSeriesAlert(true)
      } else {
        setShowSeriesAlert(false)
      }
    } else {
      setShowSeriesAlert(false)
    }
  }, [formData.client_id, clientTreatmentSeries, isEditing])

  // Populate form when editing an existing booking
  useEffect(() => {
    if (isEditing && existingBooking && !isLoadingBooking && !hasInitialized.current) {
      debugLog('Editing booking data:', existingBooking)
      
      // Set initialization flag to prevent other effects from running
      isInitializingRef.current = true
      
      const scheduledDate = existingBooking.scheduled_at ? roundToQuarterHour(new Date(existingBooking.scheduled_at)) : ''
      setFormData({
        client_id: existingBooking.client_id || '',
        service_id: existingBooking.service_id || '',
        user_id: existingBooking.staff_id || existingBooking.user_id || '', // Check both staff_id and user_id
        scheduled_at: scheduledDate ? scheduledDate.toISOString() : '',
        notes: existingBooking.notes || '',
        duration_minutes: existingBooking.duration_minutes || 60,
      })
      
      // Initialize payment data
      setPaymentData({
        is_paid: existingBooking.is_paid || false,
        payment_method: existingBooking.payment_method || '',
        payment_confirmed_at: existingBooking.payment_confirmed_at || null
      })
      
      // Check if the existing booking has a custom duration
      const service = services.find(s => s.id === existingBooking.service_id)
      if (service && existingBooking.duration_minutes !== service.duration_minutes) {
        setIsCustomDuration(true)
      }
      
      hasInitialized.current = true
      
      // Clear initialization flag after a brief delay to allow state to settle
      setTimeout(() => {
        isInitializingRef.current = false
      }, 100)
    }
  }, [isEditing, existingBooking?.id, isLoadingBooking, services]) // Only re-run when booking ID changes

  // Mutation hooks
  const createMutation = useCreateBooking()
  const updateMutation = useUpdateBooking()
  const deleteMutation = useDeleteBooking()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null) // Clear any previous errors
    
    try {
      // Prepare payload - include all fields for update
      const payload: Record<string, any> = {
        client_id: formData.client_id,
        service_id: formData.service_id,
        scheduled_at: formData.scheduled_at,
        notes: formData.notes,
        duration_minutes: formData.duration_minutes,
        is_paid: paymentData.is_paid,
        payment_method: paymentData.payment_method || null,
        payment_confirmed_at: paymentData.is_paid && !paymentData.payment_confirmed_at 
          ? new Date().toISOString() 
          : paymentData.payment_confirmed_at
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
        // Add sendConfirmationEmail for staff bookings (will respect marketing toggle setting)
        await createMutation.mutateAsync({ ...payload, sendConfirmationEmail: true })
      }
      onClose()
    } catch (error: any) {
      debugError('Failed to save booking:', error)
      
      // Extract user-friendly error message
      let userMessage = 'Er is een fout opgetreden bij het opslaan van de afspraak.'
      
      if (error?.message) {
        userMessage = error.message
      } else if (error?.code === 'PGRST116') {
        userMessage = 'U heeft geen toestemming om deze afspraak te wijzigen.'
      } else if (error?.code === '23505') {
        userMessage = 'Deze afspraak bestaat al op het geselecteerde tijdstip.'
      } else if (error?.code === '23503') {
        userMessage = 'Een van de geselecteerde opties is niet meer geldig. Ververs de pagina en probeer opnieuw.'
      }
      
      setErrorMessage(userMessage)
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


  // Payment form state
  const [paymentData, setPaymentData] = useState({
    is_paid: false,
    payment_method: '',
    payment_confirmed_at: null as string | null
  })

  // Neutral theme for all appointments
  const neutralTheme = {
    headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100',
    headerBorder: 'border-blue-200',
    accent: 'text-blue-700',
    modalBorder: 'ring-2 ring-blue-100'
  }

  if (isLoadingBooking) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">Laden...</div>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] overflow-hidden ${neutralTheme.modalBorder}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${neutralTheme.headerBorder} flex-shrink-0 ${neutralTheme.headerBg}`}>
          <div>
            <h2 className={`text-2xl font-semibold ${neutralTheme.accent}`}>{isEditing ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</h2>
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
            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
              </div>
            )}
            
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
                
                {/* Category Display - Read-only */}
                {isEditing && existingBooking?.services?.treatment_categories && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Categorie:</span>
                      <span className="text-sm text-blue-800">{existingBooking.services.treatment_categories.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Treatment Series Alert */}
            {showSeriesAlert && clientTreatmentSeries.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Deze klant heeft actieve behandelreeksen
                    </p>
                    <p className="text-sm text-amber-700 mb-3">
                      Er zijn nog openstaande sessies in een of meer behandelreeksen. 
                      Controleer of deze afspraak deel uitmaakt van een bestaande reeks.
                    </p>
                    <div className="space-y-2 mb-3">
                      {clientTreatmentSeries
                        .filter(series => series.status === 'active' && series.completed_sessions < series.total_sessions)
                        .map(series => (
                          <div key={series.id} className="bg-white p-2 rounded-lg border border-amber-200">
                            <p className="text-sm font-medium text-gray-900">{series.service_name}</p>
                            <p className="text-xs text-gray-600">
                              {series.completed_sessions} van {series.total_sessions} sessies voltooid
                              {series.next_appointment_date && (
                                <span> • Volgende: {new Date(series.next_appointment_date).toLocaleDateString('nl-NL')}</span>
                              )}
                            </p>
                          </div>
                        ))
                      }
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSeriesAlert(false)}
                      className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                    >
                      Begrepen, doorgaan met losse afspraak
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <div className="grid grid-cols-2 gap-3 mb-8">
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
                    disabled={isLoading || isLoadingBusinessHours}
                  >
                    {/* Generate time options based on business hours */}
                    {getAvailableTimeSlots().map((slot) => (
                      <option 
                        key={slot.value} 
                        value={slot.value}
                        disabled={slot.disabled}
                        className={slot.disabled ? 'text-gray-400' : ''}
                      >
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <Clock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  
                  {/* Business hours info */}
                  {businessHours && formData.scheduled_at && (
                    <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                      {(() => {
                        const selectedDate = new Date(formData.scheduled_at)
                        const dayOfWeek = selectedDate.getDay()
                        const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
                        const dayName = dayNames[dayOfWeek]
                        const selectedTime = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`
                        const isAvailable = isTimeWithinBusinessHours(businessHours, dayOfWeek, selectedTime)
                        
                        if (!isAvailable) {
                          return (
                            <span className="text-amber-600 font-medium">
                              ⚠️ Buiten openingstijden op {dayName}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Duur
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={isCustomDuration}
                    onChange={(e) => {
                      setIsCustomDuration(e.target.checked)
                      if (!e.target.checked && formData.service_id) {
                        // Reset to default duration when unchecking
                        const selectedService = services.find(s => s.id === formData.service_id)
                        if (selectedService?.duration_minutes) {
                          setFormData(p => ({ ...p, duration_minutes: selectedService.duration_minutes as number }))
                        }
                      }
                    }}
                    className="w-4 h-4 text-[#02011F] border-gray-300 rounded focus:ring-[#02011F] focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-gray-700">Aangepaste duur</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value) || 60
                      setFormData(p => ({...p, duration_minutes: newDuration}))
                      // Automatically enable custom duration when user manually changes it
                      if (!isCustomDuration) {
                        const selectedService = services.find(s => s.id === formData.service_id)
                        if (selectedService && newDuration !== selectedService.duration_minutes) {
                          setIsCustomDuration(true)
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all ${
                      isCustomDuration ? 'border-[#02011F] bg-blue-50' : 'border-gray-200'
                    }`}
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Standaard duur: {services.find(s => s.id === formData.service_id)?.duration_minutes || '--'} minuten
                </span>
                {isCustomDuration && formData.service_id && (
                  <span className="text-amber-600 font-medium">
                    ⚠️ Aangepaste duur actief
                  </span>
                )}
              </div>
            </div>
            
            {/* Payment Status */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Euro className="w-4 h-4 text-gray-400" />
                Betaling
              </h3>
              
              {/* Payment Status Toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentData.is_paid}
                    onChange={(e) => {
                      const isPaid = e.target.checked
                      setPaymentData(prev => ({
                        ...prev,
                        is_paid: isPaid,
                        payment_confirmed_at: isPaid && !prev.payment_confirmed_at 
                          ? new Date().toISOString() 
                          : prev.payment_confirmed_at
                      }))
                    }}
                    className="w-4 h-4 text-[#02011F] border-gray-300 rounded focus:ring-[#02011F] focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {paymentData.is_paid ? 'Betaald' : 'Nog niet betaald'}
                  </span>
                </label>
                
                {paymentData.is_paid && paymentData.payment_confirmed_at && (
                  <span className="text-xs text-gray-500">
                    Bevestigd op {new Date(paymentData.payment_confirmed_at).toLocaleDateString('nl-NL')}
                  </span>
                )}
              </div>

              {/* Payment Method - only show if paid */}
              {paymentData.is_paid && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Betaalmethode
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData(prev => ({...prev, payment_method: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                    disabled={isLoading}
                  >
                    <option value="">Selecteer betaalmethode</option>
                    <option value="cash">Contant</option>
                    <option value="card">Pinpas</option>
                    <option value="bank_transfer">Overschrijving</option>
                    <option value="sepa">SEPA</option>
                    <option value="other">Anders</option>
                  </select>
                </div>
              )}
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

      {/* Treatment Series Modal */}
      {showTreatmentSeriesModal && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-white">Laden...</div>
          </div>
        }>
          <CreateTreatmentSeriesModal
            isOpen={showTreatmentSeriesModal}
            onClose={() => setShowTreatmentSeriesModal(false)}
            preselectedClientId={formData.client_id}
            preselectedServiceId={formData.service_id}
          />
        </Suspense>
      )}
    </div>
  )
} 