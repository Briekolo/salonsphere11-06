'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StaffBookingWithRelations } from '@/lib/services/staffBookingService'
import { 
  useUpdateStaffBooking, 
  useDeleteStaffBooking, 
  useAddStaffBookingNotes,
  useStaffPermission 
} from '@/lib/hooks/useStaffBookings'
import { useStaffAuth } from '@/lib/hooks/useStaffAuth'
import { useClients } from '@/lib/hooks/useClients'
import { useServices } from '@/lib/hooks/useServices'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Euro, 
  FileText, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  AlertTriangle,
  Lock
} from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { getBookingStatus, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, BookingStatus } from '@/types/booking'

interface StaffBookingModalProps {
  booking: StaffBookingWithRelations | null
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => void
}

export function StaffBookingModal({ 
  booking, 
  isOpen, 
  onClose, 
  onUpdated 
}: StaffBookingModalProps) {
  const { user } = useStaffAuth()
  const { showToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newNotes, setNewNotes] = useState('')
  const [isAddingNotes, setIsAddingNotes] = useState(false)

  // Permission checks
  const { data: canEditAll } = useStaffPermission('can_edit_all_appointments')
  const { data: canAddNotes } = useStaffPermission('can_add_appointment_notes')
  const { data: canViewClients } = useStaffPermission('can_view_clients')
  const { data: canViewFinancial } = useStaffPermission('can_view_financial')

  // Data hooks
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()

  // Mutations
  const updateBooking = useUpdateStaffBooking()
  const deleteBooking = useDeleteStaffBooking()
  const addNotes = useAddStaffBookingNotes()

  // Form state
  const [formData, setFormData] = useState({
    scheduled_at: '',
    service_id: '',
    client_id: '',
    notes: '',
    internal_notes: '',
    status: 'scheduled' as const
  })

  // Determine permissions for this booking
  const isOwnBooking = booking?.staff_id === user?.id
  const canEdit = isOwnBooking || canEditAll
  const canDelete = canEdit
  const canViewClientInfo = canViewClients || isOwnBooking
  const canViewPrice = canViewFinancial || isOwnBooking

  // Initialize form when booking changes
  useEffect(() => {
    if (booking) {
      setFormData({
        scheduled_at: booking.scheduled_at ? format(new Date(booking.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
        service_id: booking.service_id || '',
        client_id: booking.client_id || '',
        notes: booking.notes || '',
        internal_notes: booking.internal_notes || '',
        status: booking.status as any || 'scheduled'
      })
      setNewNotes('')
      setIsEditing(false)
      setIsAddingNotes(false)
      setShowDeleteConfirm(false)
    }
  }, [booking])

  if (!booking) return null

  const handleSave = async () => {
    try {
      const updates: any = {}
      
      // Only include fields that can be edited
      if (canEdit) {
        if (formData.scheduled_at !== (booking.scheduled_at ? format(new Date(booking.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '')) {
          updates.scheduled_at = new Date(formData.scheduled_at).toISOString()
        }
        if (formData.service_id !== (booking.service_id || '')) {
          updates.service_id = formData.service_id || null
        }
        if (formData.client_id !== (booking.client_id || '')) {
          updates.client_id = formData.client_id || null
        }
        if (formData.status !== (booking.status || 'scheduled')) {
          updates.status = formData.status
        }
      }

      // Notes can be added if user has permission
      if (canAddNotes) {
        if (formData.notes !== (booking.notes || '')) {
          updates.notes = formData.notes
        }
        if (formData.internal_notes !== (booking.internal_notes || '')) {
          updates.internal_notes = formData.internal_notes
        }
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false)
        return
      }

      await updateBooking.mutateAsync({ 
        bookingId: booking.id, 
        updates 
      })
      
      showToast('Afspraak bijgewerkt', 'success')
      setIsEditing(false)
      onUpdated?.()
    } catch (error: any) {
      showToast(error.message || 'Fout bij bijwerken afspraak', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteBooking.mutateAsync(booking.id)
      showToast('Afspraak verwijderd', 'success')
      onClose()
      onUpdated?.()
    } catch (error: any) {
      showToast(error.message || 'Fout bij verwijderen afspraak', 'error')
    }
  }

  const handleAddNotes = async () => {
    if (!newNotes.trim()) return

    try {
      await addNotes.mutateAsync({
        bookingId: booking.id,
        notes: newNotes,
        isInternal: false
      })
      
      showToast('Notitie toegevoegd', 'success')
      setNewNotes('')
      setIsAddingNotes(false)
      onUpdated?.()
    } catch (error: any) {
      showToast(error.message || 'Fout bij toevoegen notitie', 'error')
    }
  }

  const selectedService = services.find(s => s.id === (formData.service_id || booking.service_id))
  const selectedClient = clients.find(c => c.id === (formData.client_id || booking.client_id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Afspraak Details</span>
            {!canEdit && (
              <Lock className="h-4 w-4 text-gray-400" title="Alleen bekijken" />
            )}
          </DialogTitle>
          {!isOwnBooking && (
            <DialogDescription className="text-amber-600">
              Dit is een afspraak van een andere medewerker
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Datum & Tijd</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-gray-400" />
                {isEditing && canEdit ? (
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">
                    {booking.scheduled_at && format(new Date(booking.scheduled_at), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="flex items-center space-x-2 mt-1">
                {isEditing && canEdit ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Gepland</SelectItem>
                      <SelectItem value="confirmed">Bevestigd</SelectItem>
                      <SelectItem value="in_progress">Bezig</SelectItem>
                      <SelectItem value="completed">Voltooid</SelectItem>
                      <SelectItem value="cancelled">Geannuleerd</SelectItem>
                      <SelectItem value="no_show">Niet Verschenen</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  (() => {
                    const status = getBookingStatus(booking);
                    const colors = BOOKING_STATUS_COLORS[status];
                    const label = BOOKING_STATUS_LABELS[status];
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {label}
                      </span>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          {canViewClientInfo && (
            <div>
              <Label>Klant</Label>
              <div className="mt-1">
                {isEditing && canEdit ? (
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer klant" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {booking.clients?.first_name} {booking.clients?.last_name}
                      </p>
                      {booking.clients?.email && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{booking.clients.email}</span>
                        </div>
                      )}
                      {booking.clients?.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{booking.clients.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Information */}
          <div>
            <Label>Service</Label>
            <div className="mt-1">
              {isEditing && canEdit ? (
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {service.duration_minutes}min
                        {canViewPrice && service.price && ` - €${service.price}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{booking.services?.name}</p>
                    {booking.services?.duration_minutes && (
                      <p className="text-sm text-gray-600">
                        {booking.services.duration_minutes} minuten
                      </p>
                    )}
                  </div>
                  {canViewPrice && booking.services?.price && (
                    <div className="flex items-center space-x-1 text-sm font-medium">
                      <Euro className="h-3 w-3" />
                      <span>€{booking.services.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Staff Member */}
          {booking.users && (
            <div>
              <Label>Medewerker</Label>
              <div className="mt-1 flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {booking.users.first_name} {booking.users.last_name}
                </span>
                {isOwnBooking && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Jouw afspraak
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {(canAddNotes || booking.notes) && (
            <div>
              <Label>Notities</Label>
              <div className="mt-1">
                {isEditing && canAddNotes ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Voeg notities toe..."
                    rows={3}
                  />
                ) : booking.notes ? (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Geen notities</p>
                )}
              </div>
            </div>
          )}

          {/* Add Notes Section */}
          {canAddNotes && !isEditing && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Notitie Toevoegen</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNotes(!isAddingNotes)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Notitie Toevoegen
                </Button>
              </div>
              
              {isAddingNotes && (
                <div className="space-y-2">
                  <Textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Voeg een nieuwe notitie toe..."
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleAddNotes}
                      disabled={!newNotes.trim() || addNotes.isPending}
                    >
                      Opslaan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingNotes(false)
                        setNewNotes('')
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {canDelete && !isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteBooking.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateBooking.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuleren
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateBooking.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Opslaan
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                )}
                <Button onClick={onClose}>
                  Sluiten
                </Button>
              </>
            )}
          </div>
        </DialogFooter>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Afspraak Verwijderen</span>
                </DialogTitle>
                <DialogDescription>
                  Weet je zeker dat je deze afspraak wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuleren
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteBooking.isPending}
                >
                  Ja, Verwijderen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}