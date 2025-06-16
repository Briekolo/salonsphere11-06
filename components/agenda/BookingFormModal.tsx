'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Footer in één <form> zoals bij andere modals */}
        <form onSubmit={handleSubmit} className="contents">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Client and Service Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Klant</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData(p => ({...p, client_id: e.target.value}))}
                  className="input-field"
                  required
                  disabled={isLoadingClients || isLoading}
                >
                  <option value="">{isLoadingClients ? 'Laden...' : 'Selecteer een klant'}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.first_name} {client.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Behandeling</label>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={(e) => setFormData(p => ({...p, service_id: e.target.value}))}
                  className="input-field"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum & Tijd</label>
              <input 
                type="datetime-local"
                value={formData.scheduled_at ? toInputValue(formData.scheduled_at) : ''}
                onChange={(e) => setFormData(p => ({...p, scheduled_at: new Date(e.target.value).toISOString()}))}
                className="input-field"
                required
                disabled={isLoading}
              />
            </div>
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData(p => ({...p, status: e.target.value}))}
                className="input-field"
                required
                disabled={isLoading}
              >
                <option value="confirmed">Bevestigd</option>
                <option value="scheduled">Ingepland</option>
                <option value="completed">Voltooid</option>
                <option value="cancelled">Geannuleerd</option>
              </select>
            </div>
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))}
                rows={3}
                className="input-field"
                placeholder="Interne notities over deze afspraak..."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 p-6 border-t border-gray-200 flex-shrink-0">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-danger-outlined flex items-center gap-2"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </button>
            ) : <div />}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-outlined"
                disabled={isLoading}
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={isLoading}
              >
                <Save className="w-4 h-4" />
                {isEditing ? 'Wijzigingen opslaan' : 'Afspraak inplannen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 