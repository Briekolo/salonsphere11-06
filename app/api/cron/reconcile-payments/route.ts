import { NextRequest, NextResponse } from 'next/server'
import { paymentReconciliationService } from '@/lib/services/paymentReconciliationService'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[Cron] Unauthorized reconciliation attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting scheduled payment reconciliation')
    const startTime = Date.now()

    // Run payment reconciliation
    const result = await paymentReconciliationService.reconcileAllStuckPayments()

    const duration = Date.now() - startTime
    console.log(`[Cron] Payment reconciliation completed in ${duration}ms`)
    console.log(`[Cron] Results:`, {
      processedPayments: result.processedPayments,
      fixedPayments: result.fixedPayments,
      failedPayments: result.failedPayments.length,
      errors: result.errors.length
    })

    // Log any failures for monitoring
    if (result.failedPayments.length > 0) {
      console.warn('[Cron] Failed to reconcile payments:', result.failedPayments)
    }

    if (result.errors.length > 0) {
      console.error('[Cron] Reconciliation errors:', result.errors)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      result: {
        processedPayments: result.processedPayments,
        fixedPayments: result.fixedPayments,
        failedPayments: result.failedPayments.length,
        hasErrors: result.errors.length > 0
      }
    })

  } catch (error) {
    console.error('[Cron] Payment reconciliation failed:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Payment reconciliation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support GET requests for manual testing
export async function GET(request: NextRequest) {
  try {
    // Check for development mode or admin access
    const isDevelopment = process.env.NODE_ENV === 'development'
    const hasAdminKey = request.nextUrl.searchParams.get('key') === process.env.ADMIN_KEY

    if (!isDevelopment && !hasAdminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Manual] Starting manual payment reconciliation')
    const result = await paymentReconciliationService.reconcileAllStuckPayments()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: result,
      mode: 'manual'
    })

  } catch (error) {
    console.error('[Manual] Payment reconciliation failed:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Manual reconciliation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}