'use client'

import { useState } from 'react'
import { ArrowLeft, Calculator, TrendingUp, TrendingDown } from 'lucide-react'

interface PricingCalculatorProps {
  onBack: () => void
}

export function PricingCalculator({ onBack }: PricingCalculatorProps) {
  const [calculatorData, setCalculatorData] = useState({
    treatmentName: '',
    duration: 60,
    materialCost: 0,
    laborCostPerHour: 45,
    overheadPercentage: 25,
    desiredMargin: 75,
    competitorPrice: 0
  })

  // Calculations
  const laborCost = (calculatorData.duration / 60) * calculatorData.laborCostPerHour
  const overheadCost = (laborCost + calculatorData.materialCost) * (calculatorData.overheadPercentage / 100)
  const totalCost = calculatorData.materialCost + laborCost + overheadCost
  const suggestedPrice = totalCost / (1 - calculatorData.desiredMargin / 100)
  const actualMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100
  const profitPerTreatment = suggestedPrice - totalCost

  // Competitor comparison
  const competitorMargin = calculatorData.competitorPrice > 0 
    ? ((calculatorData.competitorPrice - totalCost) / calculatorData.competitorPrice) * 100 
    : 0
  const priceDifference = suggestedPrice - calculatorData.competitorPrice
  const priceDifferencePercentage = calculatorData.competitorPrice > 0 
    ? (priceDifference / calculatorData.competitorPrice) * 100 
    : 0

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
          <h1 className="text-2xl font-bold text-gray-900">Prijscalculator</h1>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="col-span-5 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Berekeningsparameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Behandelingsnaam
                </label>
                <input
                  type="text"
                  value={calculatorData.treatmentName}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, treatmentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. Luxe Manicure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duur (minuten)
                </label>
                <input
                  type="number"
                  value={calculatorData.duration}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="15"
                  step="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materiaalkosten (€)
                </label>
                <input
                  type="number"
                  value={calculatorData.materialCost}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, materialCost: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arbeidskosten per uur (€)
                </label>
                <input
                  type="number"
                  value={calculatorData.laborCostPerHour}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, laborCostPerHour: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overhead percentage (%)
                </label>
                <input
                  type="number"
                  value={calculatorData.overheadPercentage}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, overheadPercentage: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Huur, utilities, verzekeringen, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gewenste marge (%)
                </label>
                <input
                  type="number"
                  value={calculatorData.desiredMargin}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, desiredMargin: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  max="95"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Competitor Analysis */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Concurrentieanalyse</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrentprijs (€)
              </label>
              <input
                type="number"
                value={calculatorData.competitorPrice}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, competitorPrice: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                step="0.01"
                placeholder="Optioneel"
              />
            </div>

            {calculatorData.competitorPrice > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Concurrent marge:</span>
                  <span className={`font-medium ${
                    competitorMargin >= 70 ? 'text-green-600' : 
                    competitorMargin >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {competitorMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prijsverschil:</span>
                  <div className="flex items-center gap-1">
                    {priceDifference > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`font-medium ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {priceDifference > 0 ? '+' : ''}€{priceDifference.toFixed(2)} ({priceDifferencePercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="col-span-7 space-y-6">
          {/* Cost Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Kostenanalyse</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Materiaalkosten</span>
                <span className="font-medium">€{calculatorData.materialCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Arbeidskosten ({calculatorData.duration}min)</span>
                <span className="font-medium">€{laborCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Overhead ({calculatorData.overheadPercentage}%)</span>
                <span className="font-medium">€{overheadCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-t-2 border-gray-200 font-semibold text-lg">
                <span>Totale kosten</span>
                <span>€{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Pricing Results */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Aanbevolen prijsstelling</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  €{suggestedPrice.toFixed(2)}
                </div>
                <div className="text-sm text-primary-700">Aanbevolen prijs</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {actualMargin.toFixed(1)}%
                </div>
                <div className="text-sm text-green-700">Werkelijke marge</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Winst per behandeling:</span>
                <span className="font-semibold text-green-600">€{profitPerTreatment.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Break-even punt:</span>
                <span className="font-medium">€{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Scenario Analysis */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Scenario analyse</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Prijs</th>
                    <th className="text-left py-2">Marge</th>
                    <th className="text-left py-2">Winst</th>
                    <th className="text-left py-2">vs. Concurrent</th>
                  </tr>
                </thead>
                <tbody>
                  {[0.8, 0.9, 1.0, 1.1, 1.2].map((multiplier) => {
                    const scenarioPrice = suggestedPrice * multiplier
                    const scenarioMargin = ((scenarioPrice - totalCost) / scenarioPrice) * 100
                    const scenarioProfit = scenarioPrice - totalCost
                    const scenarioDiff = calculatorData.competitorPrice > 0 
                      ? scenarioPrice - calculatorData.competitorPrice 
                      : 0

                    return (
                      <tr key={multiplier} className="border-b border-gray-100">
                        <td className="py-2 font-medium">€{scenarioPrice.toFixed(2)}</td>
                        <td className={`py-2 ${
                          scenarioMargin >= 70 ? 'text-green-600' : 
                          scenarioMargin >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {scenarioMargin.toFixed(1)}%
                        </td>
                        <td className="py-2">€{scenarioProfit.toFixed(2)}</td>
                        <td className={`py-2 ${
                          calculatorData.competitorPrice === 0 ? 'text-gray-400' :
                          scenarioDiff > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {calculatorData.competitorPrice === 0 
                            ? '-' 
                            : `${scenarioDiff > 0 ? '+' : ''}€${scenarioDiff.toFixed(2)}`
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Aanbevelingen</h2>
            
            <div className="space-y-3">
              {actualMargin < 60 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-800">Lage marge waarschuwing</div>
                  <div className="text-sm text-red-700">
                    De huidige marge is laag. Overweeg kosten te verlagen of de prijs te verhogen.
                  </div>
                </div>
              )}
              
              {calculatorData.competitorPrice > 0 && Math.abs(priceDifferencePercentage) > 20 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Prijsverschil waarschuwing</div>
                  <div className="text-sm text-yellow-700">
                    {priceDifference > 0 
                      ? 'Uw prijs ligt significant hoger dan de concurrent. Zorg voor duidelijke toegevoegde waarde.'
                      : 'Uw prijs ligt significant lager dan de concurrent. U kunt mogelijk meer vragen.'
                    }
                  </div>
                </div>
              )}
              
              {actualMargin >= 70 && actualMargin <= 85 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Optimale marge</div>
                  <div className="text-sm text-green-700">
                    Uw marge ligt in het optimale bereik voor een duurzame business.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}