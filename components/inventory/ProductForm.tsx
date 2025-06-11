'use client'

import { useState } from 'react'
import { ArrowLeft, Save, X, Upload, Package } from 'lucide-react'

interface ProductFormProps {
  productId: string | null
  onBack: () => void
}

export function ProductForm({ productId, onBack }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: 'stuks',
    costPerUnit: 0,
    supplier: '',
    location: '',
    barcode: '',
    image: ''
  })

  const isEditing = productId !== null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Product form submitted:', formData)
    onBack()
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
            {isEditing ? 'Product bewerken' : 'Nieuw product'}
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
            <h2 className="text-lg font-semibold mb-4">Productinformatie</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Productnaam *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. OPI Base Coat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. OPI-BC-001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
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
                  <option value="nail-care">Nagelverzorging</option>
                  <option value="skin-care">Huidverzorging</option>
                  <option value="hair-care">Haarverzorging</option>
                  <option value="tools">Gereedschap</option>
                  <option value="consumables">Verbruiksartikelen</option>
                  <option value="massage">Massage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eenheid *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="stuks">Stuks</option>
                  <option value="flessen">Flessen</option>
                  <option value="pakken">Pakken</option>
                  <option value="tubes">Tubes</option>
                  <option value="liter">Liter</option>
                  <option value="gram">Gram</option>
                  <option value="kilogram">Kilogram</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optionele beschrijving van het product..."
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Voorraadniveaus</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Huidige voorraad *
                </label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimale voorraad *
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximale voorraad *
                </label>
                <input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Voorraadniveau indicatie:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Groen: Voorraad boven minimaal niveau</li>
                  <li>• Geel: Voorraad op of onder minimaal niveau</li>
                  <li>• Rood: Voorraad uitgeput</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Supplier & Cost Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Leverancier & Kosten</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leverancier *
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. OPI Professional"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kostprijs per eenheid (€) *
                </label>
                <input
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPerUnit: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opslaglocatie
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. Rek A1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optioneel"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Product Image */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Productafbeelding</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
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

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Voorraadwaarde</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Huidige waarde:</span>
                <span className="font-medium">
                  €{(formData.currentStock * formData.costPerUnit).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Maximale waarde:</span>
                <span className="font-medium">
                  €{(formData.maxStock * formData.costPerUnit).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Voorraadniveau:</span>
                <span className={`font-medium ${
                  formData.currentStock <= formData.minStock ? 'text-red-600' :
                  formData.currentStock <= formData.minStock * 1.5 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formData.maxStock > 0 ? Math.round((formData.currentStock / formData.maxStock) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-900">Tips</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Stel minimale voorraad in op basis van gemiddeld verbruik</li>
              <li>• Gebruik duidelijke SKU codes voor eenvoudige identificatie</li>
              <li>• Controleer regelmatig of de voorraadniveaus kloppen</li>
              <li>• Houd rekening met levertijden bij het instellen van minimale voorraad</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}