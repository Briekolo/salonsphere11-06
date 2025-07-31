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

    try {
      // Validate file type
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Alleen CSV bestanden zijn toegestaan')
        e.target.value = ''
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Bestand is te groot. Maximum grootte is 5MB')
        e.target.value = ''
        return
      }

      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
      
      if (lines.length < 2) {
        alert('CSV bestand moet minimaal een header rij en één data rij bevatten')
        e.target.value = ''
        return
      }

      const [headerLine, ...dataLines] = lines
      const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''))
      
      // Validate required headers
      const requiredHeaders = ['name', 'current_stock', 'min_stock', 'max_stock', 'cost_per_unit', 'unit']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        alert(`Ontbrekende kolommen: ${missingHeaders.join(', ')}. Vereiste kolommen: ${requiredHeaders.join(', ')}`)
        e.target.value = ''
        return
      }

      const errors: string[] = []
      let processedCount = 0

      for (const [index, line] of dataLines.entries()) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const lineNumber = index + 2 // +2 because we start from line 2 (after header)
        
        if (values.length !== headers.length) {
          errors.push(`Regel ${lineNumber}: Aantal kolommen klopt niet (verwacht ${headers.length}, gevonden ${values.length})`)
          continue
        }

        const item: any = {}
        headers.forEach((header, idx) => {
          item[header] = values[idx]
        })

        // Validate and convert required fields
        try {
          // Name validation
          if (!item.name || item.name.trim() === '') {
            errors.push(`Regel ${lineNumber}: Productnaam is verplicht`)
            continue
          }

          // Numeric field validation and conversion
          const numericFields = ['current_stock', 'min_stock', 'max_stock', 'cost_per_unit']
          for (const field of numericFields) {
            const value = parseFloat(item[field])
            if (isNaN(value) || value < 0) {
              errors.push(`Regel ${lineNumber}: ${field} moet een geldig positief getal zijn`)
              continue
            }
            item[field] = field === 'cost_per_unit' ? value : Math.floor(value)
          }

          // Unit validation
          if (!item.unit || item.unit.trim() === '') {
            errors.push(`Regel ${lineNumber}: Eenheid is verplicht`)
            continue
          }

          // Set optional fields with defaults
          item.category = item.category || 'Geen categorie'
          item.supplier = item.supplier || ''
          item.location = item.location || ''
          item.sku = item.sku || ''
          item.description = item.description || ''

          // Try to create the item
          await createMutation.mutateAsync(item)
          processedCount++
          
        } catch (error) {
          errors.push(`Regel ${lineNumber}: Fout bij verwerken - ${error instanceof Error ? error.message : 'Onbekende fout'}`)
        }
      }

      // Show results
      if (errors.length > 0) {
        const errorMessage = `Import voltooid met ${processedCount} succesvolle items en ${errors.length} fouten:\n\n${errors.slice(0, 10).join('\n')}` + 
          (errors.length > 10 ? `\n\n... en ${errors.length - 10} meer fouten` : '')
        alert(errorMessage)
      } else {
        alert(`Import succesvol voltooid! ${processedCount} items toegevoegd.`)
      }

    } catch (error) {
      console.error('Import error:', error)
      alert('Fout bij het importeren van het bestand. Controleer of het een geldig CSV bestand is.')
    } finally {
      e.target.value = '' // reset input
    }
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