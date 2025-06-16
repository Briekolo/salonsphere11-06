'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Save, X, Plus, Trash2, Upload } from 'lucide-react'
import { useCreateService, useUpdateService } from '@/lib/hooks/useServices'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { ServiceService } from '@/lib/services/serviceService'

interface TreatmentFormProps {
  treatmentId: string | null
  onBack: () => void
}

export function TreatmentForm({ treatmentId, onBack }: TreatmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    duration: 60,
    price: 0,
    materialCost: 0,
    aantal_sessies: 1,
    preparationInfo: '',
    aftercareInfo: '',
    active: true,
    image: ''
  })

  const isEditing = treatmentId !== null
  const margin = formData.price > 0 ? ((formData.price - formData.materialCost) / formData.price * 100) : 0

  const createMutation = useCreateService()
  const updateMutation = useUpdateService()
  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)

  // fetch existing treatment when editing
  useEffect(() => {
    const fetchExisting = async () => {
      if (!isEditing || !treatmentId) return
      setLoadingExisting(true)
      try {
        const existing = await ServiceService.getById(treatmentId) as any
        if (existing) {
          setFormData({
            name: existing.name,
            category: existing.category,
            description: existing.description ?? '',
            duration: existing.duration_minutes ?? 60,
            price: existing.price,
            materialCost: existing.material_cost,
            aantal_sessies: existing.aantal_sessies ?? 1,
            preparationInfo: existing.preparation_info ?? '',
            aftercareInfo: existing.aftercare_info ?? '',
            active: existing.active,
            image: existing.image_url ?? '',
          })
        }
      } catch (err) {
        console.error('Load existing treatment failed', err)
      } finally {
        setLoadingExisting(false)
      }
    }
    fetchExisting()
  }, [isEditing, treatmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (isEditing && treatmentId) {
        await updateMutation.mutateAsync({
          id: treatmentId,
          updates: {
            name: formData.name,
            category: formData.category,
            description: formData.description,
            duration_minutes: formData.duration,
            price: formData.price,
            material_cost: formData.materialCost,
            aantal_sessies: formData.aantal_sessies,
            active: formData.active,
            preparation_info: formData.preparationInfo,
            aftercare_info: formData.aftercareInfo,
            image_url: formData.image,
          },
        } as any)
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          duration_minutes: formData.duration,
          price: formData.price,
          material_cost: formData.materialCost,
          aantal_sessies: formData.aantal_sessies,
          active: formData.active,
          preparation_info: formData.preparationInfo,
          aftercare_info: formData.aftercareInfo,
          image_url: formData.image,
        } as any)
      }
      onBack()
    } catch (error) {
      console.error('Error saving treatment', error)
      alert('Opslaan mislukt, probeer opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageSelect = async (file: File) => {
    if (!file) return
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${fileName}`
    setUploading(true)
    try {
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })
      if (uploadError) throw uploadError
      const {
        data: { publicUrl },
      } = supabase.storage.from('service-images').getPublicUrl(filePath)
      setFormData((prev) => ({ ...prev, image: publicUrl }))
    } catch (err) {
      console.error('Image upload failed', err)
      alert('Uploaden mislukt. Probeer opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Behandeling bewerken' : 'Nieuwe behandeling'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn-outlined flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || createMutation.isPending || updateMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Opslaan' : 'Aanmaken'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
        {/* Main Information */}
        <div className="col-span-8 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Basisinformatie</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Behandelingsnaam *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. Klassieke Pedicure"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecteer categorie</option>
                  <option value="Nagelverzorging">Nagelverzorging</option>
                  <option value="Gezichtsbehandelingen">Gezichtsbehandelingen</option>
                  <option value="Massage">Massage</option>
                  <option value="Ontharing">Ontharing</option>
                  <option value="Lichaamsbehandelingen">Lichaamsbehandelingen</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Beschrijf de behandeling in 2-3 zinnen..."
                required
              />
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Prijzen & Duur</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duur (minuten) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prijs (€) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aantal sessies
                </label>
                <input
                  type="number"
                  value={formData.aantal_sessies}
                  onChange={(e) => setFormData(prev => ({ ...prev, aantal_sessies: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materiaalkost (€)
                </label>
                <input
                  type="number"
                  value={formData.materialCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, materialCost: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Margin Display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Berekende marge:</span>
                  <span className={`text-lg font-bold ${
                    margin >= 80 ? 'text-green-600' : 
                    margin >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Winst: €{(formData.price - formData.materialCost).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Instructies</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voorbereiding
                </label>
                <textarea
                  value={formData.preparationInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparationInfo: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Wat moet de klant doen voor de behandeling?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazorg
                </label>
                <textarea
                  value={formData.aftercareInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, aftercareInfo: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Wat moet de klant doen na de behandeling?"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Image Upload */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Afbeelding</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center" 
              onClick={() => !formData.image && fileInputRef.current?.click()} 
              style={{ cursor: formData.image ? 'default' : 'pointer' }}>
              {formData.image ? (
                <div className="relative inline-block">
                  <img
                    src={formData.image}
                    alt="preview"
                    className="mx-auto h-24 w-auto object-cover rounded cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFormData((prev) => ({ ...prev, image: '' })) }}
                    className="absolute top-1 right-1 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-50"
                    aria-label="Foto verwijderen"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-0">
                    {uploading ? 'Uploaden...' : 'Klik om een afbeelding te kiezen'}
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleImageSelect(e.target.files[0])}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
          </div>

          {/* Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Behandeling is actief
              </label>
            </div>
            
            <p className="text-xs text-gray-600 mt-2">
              Inactieve behandelingen zijn niet zichtbaar voor klanten bij het boeken van afspraken.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}