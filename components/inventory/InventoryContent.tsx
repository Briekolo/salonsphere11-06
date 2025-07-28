'use client'

import { useState, useRef } from 'react'
import { InventoryOverview } from './InventoryOverview'
import { InventoryList } from './InventoryList'
import { ProductForm } from './ProductForm'
import { InventoryStats } from './InventoryStats'
import { InventoryFilters } from './InventoryFilters'
import { InventoryReports } from './InventoryReports'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { ProductHistoryModal } from './ProductHistoryModal'
import { LowStockBanner } from './LowStockBanner'
import { PlusCircle, FileText, Upload } from 'lucide-react'
import { useInventoryItems, useCreateInventoryItem } from '@/lib/hooks/useInventoryItems'

export function InventoryContent() {
  const [view, setView] = useState<'overview' | 'list' | 'form' | 'reports'>('overview')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [stockModalProduct, setStockModalProduct] = useState<string | null>(null)
  const [historyModalProduct, setHistoryModalProduct] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: allProducts = [] } = useInventoryItems()
  const createMutation = useCreateInventoryItem()

  const handleProductEdit = (productId: string) => {
    setSelectedProduct(productId)
    setView('form')
  }

  const handleStockAdjustment = (productId: string) => {
    setStockModalProduct(productId)
    setShowStockModal(true)
  }

  const handleViewHistory = (productId: string) => {
    setHistoryModalProduct(productId)
    setShowHistoryModal(true)
  }

  const handleExport = () => {
    if (!allProducts || allProducts.length === 0) return
    const header = [
      'name','sku','category','current_stock','min_stock','max_stock','unit','cost_per_unit','supplier','location'
    ]
    const rows = allProducts.map(p => [
      p.name,
      p.sku,
      p.category,
      p.current_stock,
      p.min_stock,
      p.max_stock,
      p.unit,
      p.cost_per_unit,
      p.supplier,
      p.location
    ])
    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'voorraad_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportButton = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const headers = headerLine.split(',')
    lines.forEach(line => {
      const values = line.split(',')
      if (values.length !== headers.length) return
      const item: any = {}
      headers.forEach((h, idx) => item[h] = values[idx])
      // Convert numeric fields
      item.current_stock = parseInt(item.current_stock)
      item.min_stock = parseInt(item.min_stock)
      item.max_stock = parseInt(item.max_stock)
      item.cost_per_unit = parseFloat(item.cost_per_unit)
      createMutation.mutate(item)
    })
    e.target.value = '' // reset input
  }

  const handleBackToOverview = () => {
    setView('overview')
    setSelectedProduct(null)
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {view === 'form' ? (
        <ProductForm productId={selectedProduct} onBack={handleBackToOverview} />
      ) : view === 'reports' ? (
        <InventoryReports onBack={handleBackToOverview} />
      ) : (
        <>
          {/* Quick Stats */}
          <InventoryStats />
          
          {/* Filters and Actions */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="overflow-x-auto">
              <InventoryFilters searchTerm={searchTerm} onSearch={setSearchTerm} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Exporteren */}
              <button onClick={handleExport} className="btn-outlined flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[40px]">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Exporteren</span>
              </button>

              {/* Importeren */}
              <button onClick={handleImportButton} className="btn-outlined flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[40px]">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importeren</span>
              </button>
              <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                onChange={handleImportFile}
                className="hidden"
              />

              {/* Nieuw product */}
              <button onClick={() => setView('form')} className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[40px]">
                <PlusCircle className="w-4 h-4" />
                <span>Nieuw product</span>
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setView('overview')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[36px] sm:min-h-[44px] flex items-center ${
                  view === 'overview'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overzicht
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[36px] sm:min-h-[44px] flex items-center ${
                  view === 'list'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lijst
              </button>
            </div>
          </div>

          {/* Main Content */}
          {view === 'overview' ? (
            <InventoryOverview 
              onProductEdit={handleProductEdit}
              onStockAdjustment={handleStockAdjustment}
              onViewHistory={handleViewHistory}
              searchTerm={searchTerm}
            />
          ) : (
            <InventoryList 
              onProductEdit={handleProductEdit}
              onStockAdjustment={handleStockAdjustment}
              onViewHistory={handleViewHistory}
              searchTerm={searchTerm}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showStockModal && stockModalProduct && (
        <StockAdjustmentModal
          productId={stockModalProduct}
          onClose={() => {
            setShowStockModal(false)
            setStockModalProduct(null)
          }}
        />
      )}

      {showHistoryModal && historyModalProduct && (
        <ProductHistoryModal
          productId={historyModalProduct}
          onClose={() => {
            setShowHistoryModal(false)
            setHistoryModalProduct(null)
          }}
        />
      )}
    </div>
  )
}