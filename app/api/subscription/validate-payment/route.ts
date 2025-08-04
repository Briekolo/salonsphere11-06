import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { paymentReconciliationService } from '@/lib/services/paymentReconciliationService'
import { mollieService } from '@/lib/services/mollieService'

export async function POST(request: NextRequest) {
  try {
    const { molliePaymentId, forceSync } = await request.json()

    if (!molliePaymentId) {
      return NextResponse.json(
        { error: 'Mollie payment ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Verify user authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`[Payment Validation] Validating payment ${molliePaymentId} for user ${session.user.id}`)

    // Get payment record from database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(
          tenant_id,
          users!inner(id)
        )
      `)
      .eq('mollie_payment_id', molliePaymentId)
      .single()

    if (paymentError || !paymentRecord) {
      console.log(`[Payment Validation] Payment record not found for ${molliePaymentId}`)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this payment's tenant
    const hasAccess = paymentRecord.subscriptions.users.some((user: any) => user.id === session.user.id)
    if (!hasAccess) {
      console.log(`[Payment Validation] User ${session.user.id} does not have access to payment ${molliePaymentId}`)
      return NextResponse.json(
        { error: 'Access denied to this payment' },
        { status: 403 }
      )
    }

    try {
      // Get current status from Mollie
      const molliePayment = await mollieService.getPayment(molliePaymentId)
      console.log(`[Payment Validation] Mollie status for ${molliePaymentId}: ${molliePayment.status}`)

      // Check if database status matches Mollie status
      const currentInternalStatus = mollieService.getInternalPaymentStatus(molliePayment.status)
      const statusMismatch = paymentRecord.status !== currentInternalStatus

      const validationResult = {
        paymentId: molliePaymentId,
        databaseStatus: paymentRecord.status,
        mollieStatus: molliePayment.status,
        internalStatus: currentInternalStatus,
        statusMismatch: statusMismatch,
        paymentDate: paymentRecord.payment_date,
        createdAt: paymentRecord.created_at,
        updatedAt: paymentRecord.updated_at,
        subscriptionId: paymentRecord.subscription_id,
        amount: {
          cents: paymentRecord.amount_cents,
          currency: paymentRecord.currency,
          mollieValue: molliePayment.amount.value,
          mollieCurrency: molliePayment.amount.currency
        },
        mollieDetails: {
          paidAt: molliePayment.paidAt,
          method: molliePayment.method,
          customerId: molliePayment.customerId
        }
      }

      // If there's a status mismatch or forceSync is requested, perform reconciliation
      if (statusMismatch || forceSync) {
        console.log(`[Payment Validation] ${forceSync ? 'Force sync requested' : 'Status mismatch detected'} - performing reconciliation`)
        
        const reconciliationSuccess = await paymentReconciliationService.forceReconcilePayment(molliePaymentId)
        
        if (reconciliationSuccess) {
          console.log(`[Payment Validation] Successfully reconciled payment ${molliePaymentId}`)
          
          // Get updated payment record
          const { data: updatedPaymentRecord } = await supabase
            .from('subscription_payments')
            .select('status, payment_date, updated_at')
            .eq('mollie_payment_id', molliePaymentId)
            .single()

          return NextResponse.json({
            success: true,
            action: 'reconciled',
            before: validationResult,
            after: {
              ...validationResult,
              databaseStatus: updatedPaymentRecord?.status || validationResult.databaseStatus,
              paymentDate: updatedPaymentRecord?.payment_date || validationResult.paymentDate,
              updatedAt: updatedPaymentRecord?.updated_at || validationResult.updatedAt,
              statusMismatch: false
            },
            message: 'Payment status synchronized successfully'
          })
        } else {
          console.error(`[Payment Validation] Failed to reconcile payment ${molliePaymentId}`)
          
          return NextResponse.json({
            success: false,
            action: 'reconciliation_failed',
            validation: validationResult,
            message: 'Payment validation found issues but reconciliation failed'
          }, { status: 500 })
        }
      }

      // No issues found
      console.log(`[Payment Validation] Payment ${molliePaymentId} is in sync`)
      
      return NextResponse.json({
        success: true,
        action: 'validated',
        validation: validationResult,
        message: 'Payment status is synchronized'
      })

    } catch (mollieError) {
      console.error(`[Payment Validation] Error fetching payment from Mollie:`, mollieError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to validate payment with Mollie',
        details: mollieError instanceof Error ? mollieError.message : 'Unknown Mollie error',
        paymentRecord: {
          id: paymentRecord.id,
          status: paymentRecord.status,
          createdAt: paymentRecord.created_at
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[Payment Validation] Validation error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Payment validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for simple payment status checks
export async function GET(request: NextRequest) {
  try {
    const molliePaymentId = request.nextUrl.searchParams.get('paymentId')
    
    if (!molliePaymentId) {
      return NextResponse.json(
        { error: 'Payment ID parameter is required' },
        { status: 400 }
      )
    }

    // Forward to POST handler with validation-only mode
    return await POST(new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ molliePaymentId, forceSync: false })
    }))

  } catch (error) {
    console.error('[Payment Validation] GET validation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Payment validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}