'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, X, Upload, Package } from 'lucide-react'
import { useCreateInventoryItem, useUpdateInventoryItem, useInventoryItems } from '@/lib/hooks/useInventoryItems'
import { InventoryService } from '@/lib/services/inventoryService'

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
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit: 'stuks',
    cost_per_unit: 0,
    supplier: '',
    location: '',
    barcode: '',
  })
  
  const isEditing = productId !== null
  const createMutation = useCreateInventoryItem()
  const updateMutation = useUpdateInventoryItem()

  const { data: products } = useInventoryItems()

  useEffect(() => {
    if (isEditing && products) {
      const productToEdit = products.find(p => p.id === productId)
      if (productToEdit) {
        setFormData({
          name: productToEdit.name,
          sku: productToEdit.sku ?? '',
          category: productToEdit.category,
          description: productToEdit.description ?? '',
          current_stock: productToEdit.current_stock,
          min_stock: productToEdit.min_stock,
          max_stock: productToEdit.max_stock,
          unit: productToEdit.unit,
          cost_per_unit: productToEdit.cost_per_unit,
          supplier: productToEdit.supplier ?? '',
          location: productToEdit.location ?? '',
          barcode: productToEdit.barcode ?? ''
        })
      }
    }
  }, [isEditing, productId, products])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEditing && productId) {
        await updateMutation.mutateAsync({ id: productId, updates: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      onBack()
    } catch (error) {
      console.error('Failed to save product', error)
      // Optionally: show an error message to the user
    }
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
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn-primary"
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
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. OPI-BC-001"
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
                  value={formData.current_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimale voorraad
                </label>
                <input
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximale voorraad
                </label>
                <input
                  type="number"
                  value={formData.max_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Supplier & Cost Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Leverancier & Kosten</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leverancier
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. OPI Professional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kostprijs per eenheid (€) *
                </label>
                <input
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Identificatie</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locatie in salon
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. Kast 3, plank 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode (EAN, UPC)
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Scan of voer barcode in"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}