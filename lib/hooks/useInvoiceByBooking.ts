'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Invoice } from '@/types/invoice'

export function useInvoiceByBooking(bookingId: string | null) {
  return useQuery<Invoice | null>({
    queryKey: ['invoice-by-booking', bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      if (!bookingId) return null

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching invoice by booking:', error)
        return null
      }

      return data as Invoice
    }
  })
}