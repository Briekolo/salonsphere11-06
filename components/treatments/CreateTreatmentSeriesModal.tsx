'use client'

import { useState } from 'react'
import { X, Save, Calendar, Users, Euro, Clock, Info } from 'lucide-react'
import { format, addWeeks } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useClients } from '@/lib/hooks/useClients'
import { useServices } from '@/lib/hooks/useServices'
import { useUsers } from '@/lib/hooks/useUsers'
import { useCreateTreatmentSeries } from '@/lib/hooks/useTreatmentSeries'
import { CreateTreatmentSeriesParams } from '@/lib/services/treatmentSeriesService'

interface CreateTreatmentSeriesModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedClientId?: string
  preselectedServiceId?: string
}

export function CreateTreatmentSeriesModal({ 
  isOpen, 
  onClose, 
  preselectedClientId,
  preselectedServiceId 
}: CreateTreatmentSeriesModalProps) {
  const [formData, setFormData] = useState<CreateTreatmentSeriesParams>({
    client_id: preselectedClientId || '',
    service_id: preselectedServiceId || '',
    staff_id: '',
    start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    total_sessions: 3,
    interval_weeks: 2,
    package_discount: 0,
    notes: ''
  })

  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()
  const { data: staff = [] } = useUsers()
  const createMutation = useCreateTreatmentSeries()

  const selectedService = services.find(s => s.id === formData.service_id)
  const basePrice = selectedService?.price || 0
  const totalPriceBeforeDiscount = basePrice * formData.total_sessions
  const discountAmount = totalPriceBeforeDiscount * (formData.package_discount / 100)
  const finalPrice = totalPriceBeforeDiscount - discountAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createMutation.mutateAsync(formData)
      onClose()
      // Reset form
      setFormData({
        client_id: '',
        service_id: '',
        staff_id: '',
        start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        total_sessions: 3,
        interval_weeks: 2,
        package_discount: 0,
        notes: ''
      })
    } catch (error) {
      console.error('Error creating treatment series:', error)
    }
  }

  // Calculate session dates preview
  const getSessionDates = () => {
    const dates = []
    const startDate = new Date(formData.start_date)
    
    for (let i = 0; i < formData.total_sessions; i++) {
      const sessionDate = addWeeks(startDate, i * (formData.interval_weeks || 1))
      dates.push(sessionDate)
    }
    
    return dates
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-50 to-purple-100">
          <div>
            <h2 className="text-2xl font-semibold text-purple-700">Nieuwe Behandelreeks</h2>
            <p className="text-sm text-gray-600 mt-1">Plan een serie behandelingen in één keer</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* Client and Service Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" />
                  Klant
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  required
                  disabled={!!preselectedClientId}
                >
                  <option value="">Selecteer een klant</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Behandeling
                </label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  required
                  disabled={!!preselectedServiceId}
                >
                  <option value="">Selecteer een behandeling</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - €{service.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Staff Member */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="w-4 h-4 text-gray-400" />
                Medewerker (optioneel)
              </label>
              <select
                value={formData.staff_id}
                onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              >
                <option value="">Geen voorkeur</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Series Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Startdatum
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Aantal sessies
                </label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={formData.total_sessions}
                  onChange={(e) => setFormData({...formData, total_sessions: parseInt(e.target.value) || 2})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Interval (weken)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.interval_weeks}
                  onChange={(e) => setFormData({...formData, interval_weeks: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Package Discount */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Euro className="w-4 h-4 text-gray-400" />
                Pakketkorting (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={formData.package_discount}
                  onChange={(e) => setFormData({...formData, package_discount: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium">{formData.package_discount}%</span>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-medium text-purple-900 mb-3">Prijsoverzicht</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prijs per sessie:</span>
                  <span className="font-medium">€{basePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aantal sessies:</span>
                  <span className="font-medium">{formData.total_sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotaal:</span>
                  <span className="font-medium">€{totalPriceBeforeDiscount.toFixed(2)}</span>
                </div>
                {formData.package_discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Korting ({formData.package_discount}%):</span>
                    <span className="font-medium">-€{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="text-purple-900 font-medium">Totaalprijs:</span>
                  <span className="text-purple-900 font-bold text-lg">€{finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Session Dates Preview */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Info className="w-4 h-4 text-gray-400" />
                Geplande sessiedatums
              </h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getSessionDates().map((date, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">Sessie {index + 1}</p>
                      <p className="text-sm font-medium">
                        {format(date, 'd MMM yyyy', { locale: nl })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(date, 'HH:mm', { locale: nl })}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Deze datums zijn indicatief. De precieze planning kan worden aangepast na het aanmaken.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Notities (optioneel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                placeholder="Voeg eventuele notities toe over deze behandelreeks..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-all font-medium"
            >
              Annuleren
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Bezig...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Behandelreeks aanmaken</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}