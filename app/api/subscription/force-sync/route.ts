import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { paymentReconciliationService } from '@/lib/services/paymentReconciliationService'
import { mollieService } from '@/lib/services/mollieService'
import { paymentLogger } from '@/lib/utils/paymentLogger'
import { Database } from '@/types/database'

type SubscriptionPayment = Database['public']['Tables']['subscription_payments']['Row']

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { paymentId, molliePaymentId, adminKey } = await request.json()

    // Optional admin key protection for production
    if (process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!paymentId && !molliePaymentId) {
      return NextResponse.json(
        { error: 'Either paymentId or molliePaymentId is required' },
        { status: 400 }
      )
    }

    console.log(`[Force Sync] Starting manual sync for payment ${molliePaymentId || paymentId}`)
    
    const supabase = await createServerSupabaseClient()

    // Find payment record
    let paymentRecord: SubscriptionPayment | null = null
    
    if (molliePaymentId) {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('mollie_payment_id', molliePaymentId)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Payment not found by Mollie ID' },
          { status: 404 }
        )
      }
      paymentRecord = data
    } else {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('id', paymentId)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Payment not found by ID' },
          { status: 404 }
        )
      }
      paymentRecord = data
    }

    // Get current Mollie status
    let molliePayment
    try {
      molliePayment = await mollieService.getPayment(paymentRecord.mollie_payment_id!)
    } catch (error) {
      console.error('[Force Sync] Failed to fetch from Mollie:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch payment from Mollie',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Log status mismatch if any
    const currentInternalStatus = paymentRecord.status
    const mollieStatus = molliePayment.status
    const expectedInternalStatus = mollieService.getInternalPaymentStatus(mollieStatus)
    
    if (currentInternalStatus !== expectedInternalStatus) {
      paymentLogger.statusMismatch(paymentRecord.mollie_payment_id!, {
        paymentId: paymentRecord.id,
        databaseStatus: currentInternalStatus,
        mollieStatus: mollieStatus,
        subscriptionId: paymentRecord.subscription_id
      })
    }

    // Force reconciliation
    console.log(`[Force Sync] Forcing reconciliation for payment ${paymentRecord.mollie_payment_id}`)
    const reconciled = await paymentReconciliationService.forceReconcilePayment(paymentRecord.mollie_payment_id!)

    if (!reconciled) {
      return NextResponse.json(
        { 
          error: 'Reconciliation failed',
          currentStatus: {
            database: currentInternalStatus,
            mollie: mollieStatus
          }
        },
        { status: 500 }
      )
    }

    // Get updated payment record
    const { data: updatedPayment } = await supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(
          id,
          status,
          tenant_id
        )
      `)
      .eq('id', paymentRecord.id)
      .single()

    const duration = Date.now() - startTime
    console.log(`[Force Sync] Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Payment forcefully synchronized',
      payment: {
        id: updatedPayment?.id,
        molliePaymentId: updatedPayment?.mollie_payment_id,
        previousStatus: currentInternalStatus,
        currentStatus: updatedPayment?.status,
        mollieStatus: mollieStatus,
        subscription: (updatedPayment as any)?.subscriptions
      },
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('[Force Sync] Error:', error)
    return NextResponse.json(
      { 
        error: 'Force sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Support GET for easy manual testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const molliePaymentId = searchParams.get('molliePaymentId')
  const paymentId = searchParams.get('paymentId')
  const adminKey = searchParams.get('adminKey')

  if (!molliePaymentId && !paymentId) {
    return NextResponse.json({
      error: 'Missing required parameters',
      usage: {
        POST: {
          body: {
            molliePaymentId: 'tr_xxxxx (optional)',
            paymentId: 'uuid (optional)',
            adminKey: 'admin key (if configured)'
          }
        },
        GET: '?molliePaymentId=tr_xxxxx&adminKey=xxx'
      }
    }, { status: 400 })
  }

  // Forward to POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      molliePaymentId,
      paymentId,
      adminKey
    })
  }))
}