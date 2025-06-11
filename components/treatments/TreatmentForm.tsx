'use client'

import { useState } from 'react'
import { ArrowLeft, Save, X, Plus, Trash2, Upload } from 'lucide-react'

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
    preparationInfo: '',
    aftercareInfo: '',
    productsUsed: [''],
    certifications: [''],
    active: true,
    image: ''
  })

  const isEditing = treatmentId !== null
  const margin = formData.price > 0 ? ((formData.price - formData.materialCost) / formData.price * 100) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    onBack()
  }

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      productsUsed: [...prev.productsUsed, '']
    }))
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productsUsed: prev.productsUsed.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      productsUsed: prev.productsUsed.map((product, i) => i === index ? value : product)
    }))
  }

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }))
  }

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }))
  }

  const updateCertification = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }))
  }

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
                  Materiaalkosten (€)
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
            </div>

            {/* Margin Display */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
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

          {/* Products Used */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Gebruikte producten</h2>
              <button
                type="button"
                onClick={addProduct}
                className="btn-outlined text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Product toevoegen
              </button>
            </div>

            <div className="space-y-3">
              {formData.productsUsed.map((product, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => updateProduct(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. OPI Base Coat"
                  />
                  {formData.productsUsed.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
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
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Sleep een afbeelding hierheen of klik om te uploaden
              </p>
              <button
                type="button"
                className="btn-outlined text-sm"
              >
                Bestand kiezen
              </button>
            </div>
          </div>

          {/* Certifications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Certificeringen</h3>
              <button
                type="button"
                onClick={addCertification}
                className="btn-outlined text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Toevoegen
              </button>
            </div>

            <div className="space-y-3">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) => updateCertification(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. CIDESCO Diploma"
                  />
                  {formData.certifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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