'use client'

import { useState } from 'react'
import { InventoryOverview } from './InventoryOverview'
import { InventoryList } from './InventoryList'
import { ProductForm } from './ProductForm'
import { InventoryStats } from './InventoryStats'
import { InventoryFilters } from './InventoryFilters'
import { InventoryReports } from './InventoryReports'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { ProductHistoryModal } from './ProductHistoryModal'

export function InventoryContent() {
  const [view, setView] = useState<'overview' | 'list' | 'form' | 'reports'>('overview')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [stockModalProduct, setStockModalProduct] = useState<string | null>(null)
  const [historyModalProduct, setHistoryModalProduct] = useState<string | null>(null)

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
              <InventoryFilters />
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => setView('reports')}
                className="btn-outlined"
              >
                Rapportages
              </button>
              <button className="btn-outlined">
                Exporteren
              </button>
              <button className="btn-outlined">
                Importeren
              </button>
              <button 
                onClick={() => setView('form')}
                className="btn-primary"
              >
                Nieuw product
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setView('overview')}
                className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                  view === 'overview'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overzicht
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center ${
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
            />
          ) : (
            <InventoryList 
              onProductEdit={handleProductEdit}
              onStockAdjustment={handleStockAdjustment}
              onViewHistory={handleViewHistory}
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