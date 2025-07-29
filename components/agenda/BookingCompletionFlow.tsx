'use client'

import { useState, useEffect } from 'react'
import { useUpdateBooking } from '@/lib/hooks/useBookings'
import { useInvoiceByBooking } from '@/lib/hooks/useInvoiceByBooking'
import { QuickPaymentModal } from '@/components/invoices/QuickPaymentModal'
import { CheckCircle, FileText, Euro } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface BookingCompletionFlowProps {
  bookingId: string
  clientName: string
  serviceName: string
  servicePrice: number
  onClose: () => void
}

export function BookingCompletionFlow({
  bookingId,
  clientName,
  serviceName,
  servicePrice,
  onClose
}: BookingCompletionFlowProps) {
  const [step, setStep] = useState<'completing' | 'invoice-created' | 'payment'>('completing')
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const updateBooking = useUpdateBooking()
  const { data: invoice, refetch: refetchInvoice } = useInvoiceByBooking(bookingId)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Start the completion process
    completeBooking()
  }, [])

  const completeBooking = async () => {
    try {
      // Mark booking as paid
      await updateBooking.mutateAsync({
        id: bookingId,
        updates: {
          is_paid: true,
          payment_confirmed_at: new Date().toISOString()
        }
      })

      // Wait a moment for the trigger to create the invoice
      setTimeout(async () => {
        await refetchInvoice()
        setStep('invoice-created')
      }, 1000)
    } catch (error) {
      console.error('Error completing booking:', error)
      alert('Er is een fout opgetreden bij het voltooien van de afspraak.')
      onClose()
    }
  }

  useEffect(() => {
    if (step === 'invoice-created' && invoice) {
      setInvoiceId(invoice.id)
      // Show invoice created message for 2 seconds
      setTimeout(() => {
        setStep('payment')
      }, 2000)
    }
  }, [step, invoice])

  const handlePaymentComplete = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['revenue-data'] })
    queryClient.invalidateQueries({ queryKey: ['tenant_metrics'] })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {step === 'completing' && (
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Afspraak voltooien...</h3>
            <p className="text-gray-600">Een moment geduld alstublieft</p>
          </div>
        </div>
      )}

      {step === 'invoice-created' && (
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Afspraak voltooid!</h3>
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
              <FileText className="w-5 h-5" />
              <p>Factuur is automatisch aangemaakt</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium">{serviceName}</p>
              <p className="text-gray-600">Klant: {clientName}</p>
              <div className="flex items-center justify-center gap-1 mt-2 font-semibold">
                <Euro className="w-4 h-4" />
                <span>{servicePrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && invoiceId && invoice && (
        <QuickPaymentModal
          isOpen={true}
          onClose={onClose}
          invoiceId={invoiceId}
          totalAmount={invoice.total_amount || servicePrice * 1.21} // Include BTW
          clientName={clientName}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}