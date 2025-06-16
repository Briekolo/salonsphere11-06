import { useState, useEffect } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useCreateClient, useUpdateClient, useClients } from '@/lib/hooks/useClients'
import { ClientService } from '@/lib/services/clientService'

interface ClientFormProps {
  clientId: string | null
  onBack: () => void
}

export function ClientForm({ clientId, onBack }: ClientFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()

  const isEditing = clientId !== null

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    marketing_consent: false,
    notes: '',
  })

  useEffect(() => {
    const fetchExisting = async () => {
      if (!clientId) return
      setLoadingExisting(true)
      const data = await ClientService.getById(clientId) as any
      if (data) {
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth ?? '',
          address: data.address ?? '',
          marketing_consent: data.marketing_consent ?? false,
          notes: data.notes ?? '',
        })
      }
      setLoadingExisting(false)
    }
    fetchExisting()
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: clientId, updates: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onBack();
    } catch (error) {
      console.error('Failed to save client', error);
      alert('Opslaan mislukt.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingExisting) return <p>Klantgegevens laden...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Klant bewerken' : 'Nieuwe klant'}
          </h1>
        </div>

        <div className="stack-on-mobile sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="btn-outlined flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Annuleren
          </button>
          <button
            type="submit"
            disabled={submitting || createMutation.isPending || updateMutation.isPending}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Wijzigingen opslaan' : 'Klant opslaan'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Basisinformatie */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Persoonlijke gegevens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e)=>setFormData(p=>({...p, first_name: e.target.value}))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e)=>setFormData(p=>({...p, last_name: e.target.value}))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e)=>setFormData(p=>({...p, email: e.target.value}))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e)=>setFormData(p=>({...p, phone: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geboortedatum</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e)=>setFormData(p=>({...p, date_of_birth: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Adres & voorkeuren</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e)=>setFormData(p=>({...p, address: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.marketing_consent}
                  onChange={(e)=>setFormData(p=>({...p, marketing_consent: e.target.checked}))}
                  id="marketing"
                  className="border-gray-300 text-primary-600 focus:ring-primary-600"
                />
                <label htmlFor="marketing" className="text-sm text-gray-700">Toestemming voor marketing</label>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Notities</h2>
            <div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Interne notities over deze klant..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Overzicht</h2>
            <p className="text-sm text-gray-600">Vul de velden in en klik op Opslaan om de klant toe te voegen.</p>
          </div>
        </div>
      </form>
    </div>
  )
} 