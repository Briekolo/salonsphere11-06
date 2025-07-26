'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2, Calendar, Clock, User, Briefcase, FileText, Users } from 'lucide-react'
import { useCreateBooking, useUpdateBooking, useDeleteBooking, useBooking } from '@/lib/hooks/useBookings'
import { useClients } from '@/lib/hooks/useClients'
import { useServices } from '@/lib/hooks/useServices'
import { useUsers } from '@/lib/hooks/useUsers'

interface BookingFormModalProps {
  bookingId?: string | null
  initialDate?: Date
  onClose: () => void
}

export function BookingFormModal({ bookingId, initialDate, onClose }: BookingFormModalProps) {
  // Helper: converteer ISO (UTC) naar value compatibel met <input type="datetime-local">
  const toInputValue = (iso: string) => {
    const date = new Date(iso)
    // Corrigeer naar lokale tijd zonder offset in string
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    user_id: '', // staff member
    scheduled_at: initialDate ? initialDate.toISOString() : new Date().toISOString(),
    status: 'confirmed',
    notes: '',
    duration_minutes: 60, // Default duration
  })
  
  // Debug log to check if initialDate has the right time
  useEffect(() => {
    if (initialDate) {
      console.log('Initial date with time:', initialDate)
    }
  }, [initialDate])

  const isEditing = Boolean(bookingId)

  // Data fetching hooks
  const { data: clients = [], isLoading: isLoadingClients } = useClients()
  const { data: services = [], isLoading: isLoadingServices } = useServices()
  const { data: staff = [], isLoading: isLoadingStaff } = useUsers({ role: 'staff' })
  const { data: existingBooking, isLoading: isLoadingBooking } = useBooking(bookingId || null)

  // Update duration when service changes
  useEffect(() => {
    const selectedService = services.find(s => s.id === formData.service_id)
    if (selectedService && selectedService.duration_minutes) {
      setFormData(p => ({ ...p, duration_minutes: selectedService.duration_minutes as number }))
    }
  }, [formData.service_id, services])

  // Populate form when editing an existing booking
  useEffect(() => {
    if (isEditing && existingBooking) {
      setFormData({
        client_id: existingBooking.client_id || '',
        service_id: existingBooking.service_id || '',
        user_id: existingBooking.user_id || '',
        scheduled_at: existingBooking.scheduled_at || '',
        status: existingBooking.status || 'confirmed',
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
      // Maak een kopie zonder het (tijdelijk verborgen) user_id veld
      const { user_id, ...payload } = formData as any

      if (isEditing) {
        if (!bookingId) return
        await updateMutation.mutateAsync({ id: bookingId, updates: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save booking:', error)
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
        console.error('Failed to delete booking:', error)
      }
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || isLoadingBooking;

  if (isLoadingBooking) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">Laden...</div>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{isEditing ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</h2>
            <p className="text-sm text-gray-500 mt-1">{isEditing ? 'Pas de details van de afspraak aan' : 'Plan een nieuwe afspraak in'}</p>
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
            {false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medewerker</label>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData(p => ({...p, user_id: e.target.value}))}
                  className="input-field"
                  required
                  disabled={isLoadingStaff || isLoading}
                >
                  <option value="">{isLoadingStaff ? 'Laden...' : 'Selecteer een medewerker'}</option>
                  {staff.map(member => {
                    const label = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() || member.email || 'Onbekende medewerker'
                    return (
                      <option key={member.id} value={member.id}>{label}</option>
                    )
                  })}
                </select>
              </div>
            )}
            {/* Date and Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                Datum & Tijd
              </label>
              <div className="relative">
                <input 
                  type="datetime-local"
                  value={formData.scheduled_at ? toInputValue(formData.scheduled_at) : ''}
                  onChange={(e) => setFormData(p => ({...p, scheduled_at: new Date(e.target.value).toISOString()}))}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02011F]/20 focus:border-[#02011F] transition-all"
                  required
                  disabled={isLoading}
                />
                <Clock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
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