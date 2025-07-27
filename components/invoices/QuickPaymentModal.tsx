'use client'

import { useState } from 'react'
import { X, Euro, CreditCard, Banknote, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PaymentMethod } from '@/types/invoice'

interface QuickPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId: string
  totalAmount: number
  clientName: string
  onPaymentComplete: () => void
}

const paymentMethods = [
  { id: 'cash' as PaymentMethod, label: 'Contant', icon: Banknote },
  { id: 'card' as PaymentMethod, label: 'Pin/Creditcard', icon: CreditCard },
  { id: 'bank_transfer' as PaymentMethod, label: 'Overschrijving', icon: Building2 },
]

export function QuickPaymentModal({
  isOpen,
  onClose,
  invoiceId,
  totalAmount,
  clientName,
  onPaymentComplete
}: QuickPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      // Register payment
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoiceId,
          amount: totalAmount,
          payment_method: selectedMethod,
          payment_date: new Date().toISOString().split('T')[0],
          notes
        })

      if (paymentError) throw paymentError

      // Update invoice status to paid
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_amount: totalAmount,
          payment_method: selectedMethod
        })
        .eq('id', invoiceId)

      if (invoiceError) throw invoiceError

      onPaymentComplete()
      onClose()
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Er is een fout opgetreden bij het verwerken van de betaling.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Betaling Registreren</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Amount Display */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Te betalen bedrag</p>
              <div className="flex items-center gap-2">
                <Euro className="w-6 h-6 text-gray-600" />
                <p className="text-2xl font-semibold">
                  {totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">Klant: {clientName}</p>
            </div>

            {/* Payment Method Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Betaalmethode</p>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <p className={`text-sm font-medium ${
                        selectedMethod === method.id ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {method.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notities (optioneel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Bijv. Klant betaalt volgende keer het restant"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Verwerken...' : 'Betaling Bevestigen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}