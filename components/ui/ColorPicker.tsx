'use client'

import { useState, useEffect } from 'react'
import { Check, Palette, Pipette } from 'lucide-react'

const PRESET_COLORS = [
  { bg: 'bg-pink-100', text: 'text-pink-800', value: 'pink', hex: '#fce7f3', border: 'border-pink-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', value: 'purple', hex: '#f3e8ff', border: 'border-purple-200' },
  { bg: 'bg-blue-100', text: 'text-blue-800', value: 'blue', hex: '#dbeafe', border: 'border-blue-200' },
  { bg: 'bg-green-100', text: 'text-green-800', value: 'green', hex: '#dcfce7', border: 'border-green-200' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', value: 'yellow', hex: '#fef3c7', border: 'border-yellow-200' },
  { bg: 'bg-red-100', text: 'text-red-800', value: 'red', hex: '#fee2e2', border: 'border-red-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', value: 'indigo', hex: '#e0e7ff', border: 'border-indigo-200' },
  { bg: 'bg-teal-100', text: 'text-teal-800', value: 'teal', hex: '#ccfbf1', border: 'border-teal-200' },
]

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  className?: string
}

export function ColorPicker({ selectedColor, onColorChange, className = '' }: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#3b82f6')

  // Check if selected color is a preset or custom
  const selectedPreset = PRESET_COLORS.find(c => c.value === selectedColor)
  const isCustomColor = selectedColor.startsWith('#')

  // Update custom color when a hex color is selected
  useEffect(() => {
    if (isCustomColor) {
      setCustomColor(selectedColor)
    }
  }, [selectedColor, isCustomColor])

  const handlePresetSelect = (colorOption: typeof PRESET_COLORS[0]) => {
    onColorChange(colorOption.value)
    setShowCustomPicker(false)
  }

  const handleCustomColorSelect = () => {
    onColorChange(customColor)
    setShowCustomPicker(false)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preset Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Standaard kleuren
        </label>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_COLORS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => handlePresetSelect(colorOption)}
              className={`
                relative flex items-center justify-center
                px-3 py-2.5 rounded-lg text-xs font-medium
                transition-all duration-200 
                ${selectedColor === colorOption.value 
                  ? `ring-2 ring-offset-2 ring-gray-900 ${colorOption.bg} ${colorOption.text} ${colorOption.border} border shadow-sm`
                  : `${colorOption.bg} ${colorOption.text} ${colorOption.border} border hover:shadow-md hover:scale-105`
                }
              `}
            >
              <span className="relative">
                {colorOption.value.charAt(0).toUpperCase() + colorOption.value.slice(1)}
                {selectedColor === colorOption.value && (
                  <Check className="w-3 h-3 absolute -top-0.5 -right-4" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Section */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Aangepaste kleur
        </label>
        
        {/* Custom Color Button */}
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 
            border rounded-lg transition-all duration-200
            ${isCustomColor || showCustomPicker
              ? 'border-gray-900 bg-gray-50 shadow-sm'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <Pipette className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {isCustomColor ? 'Aangepaste kleur geselecteerd' : 'Kies een aangepaste kleur'}
          </span>
          {isCustomColor && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">{selectedColor}</span>
              <div
                className="w-6 h-6 rounded-md border border-gray-300 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
          )}
        </button>

        {/* Color Picker Panel */}
        {showCustomPicker && (
          <div className="mt-3 p-5 border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="space-y-5">
              {/* Color Picker Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Selecteer een kleur</h4>
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-inner"
                  style={{ backgroundColor: customColor }}
                />
              </div>
              
              {/* Native Color Picker */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-48 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                    style={{ backgroundColor: customColor }}
                  />
                  <div className="absolute inset-0 rounded-lg border-2 border-gray-300 pointer-events-none" />
                </div>
              </div>
              
              {/* Color Code Input */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Hex kleurcode
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setCustomColor(value)
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="#3b82f6"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(customColor)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Kopieer kleurcode"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCustomColorSelect}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Kleur toepassen
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Color Preview */}
      {(selectedPreset || isCustomColor) && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600">Geselecteerd:</span>
              <div
                className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                  selectedPreset ? `${selectedPreset.bg} ${selectedPreset.text} ${selectedPreset.border} border` : 'text-white'
                }`}
                style={isCustomColor ? { backgroundColor: selectedColor } : {}}
              >
                Voorbeeldcategorie
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCustomColor && (
                <span className="text-xs font-mono text-gray-500">{selectedColor}</span>
              )}
              {selectedPreset && (
                <span className="text-xs text-gray-500 capitalize">{selectedPreset.value}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}