export enum PaymentLogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum PaymentLogEvent {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  WEBHOOK_FAILED = 'WEBHOOK_FAILED',
  WEBHOOK_MISSING = 'WEBHOOK_MISSING',
  RECONCILIATION_STARTED = 'RECONCILIATION_STARTED',
  RECONCILIATION_SUCCESS = 'RECONCILIATION_SUCCESS',
  RECONCILIATION_FAILED = 'RECONCILIATION_FAILED',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  STATUS_MISMATCH = 'STATUS_MISMATCH',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED'
}

export interface PaymentLogEntry {
  timestamp: string
  level: PaymentLogLevel
  event: PaymentLogEvent
  paymentId?: string
  molliePaymentId?: string
  subscriptionId?: string
  tenantId?: string
  message: string
  metadata?: Record<string, any>
  error?: string
  duration?: number
}

class PaymentLogger {
  private getLogPrefix(event: PaymentLogEvent): string {
    return `[PaymentLog:${event}]`
  }

  private createLogEntry(
    level: PaymentLogLevel,
    event: PaymentLogEvent,
    message: string,
    data?: {
      paymentId?: string
      molliePaymentId?: string
      subscriptionId?: string
      tenantId?: string
      metadata?: Record<string, any>
      error?: Error | string
      duration?: number
    }
  ): PaymentLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event,
      paymentId: data?.paymentId,
      molliePaymentId: data?.molliePaymentId,
      subscriptionId: data?.subscriptionId,
      tenantId: data?.tenantId,
      message,
      metadata: data?.metadata,
      error: data?.error instanceof Error ? data.error.message : data?.error,
      duration: data?.duration
    }
  }

  private log(entry: PaymentLogEntry): void {
    const logMessage = `${this.getLogPrefix(entry.event)} ${entry.message}`
    const logData = {
      timestamp: entry.timestamp,
      paymentId: entry.paymentId,
      molliePaymentId: entry.molliePaymentId,
      subscriptionId: entry.subscriptionId,
      tenantId: entry.tenantId,
      metadata: entry.metadata,
      duration: entry.duration ? `${entry.duration}ms` : undefined,
      error: entry.error
    }

    // Filter out undefined values
    const cleanLogData = Object.fromEntries(
      Object.entries(logData).filter(([_, value]) => value !== undefined)
    )

    switch (entry.level) {
      case PaymentLogLevel.ERROR:
        console.error(logMessage, cleanLogData)
        break
      case PaymentLogLevel.WARN:
        console.warn(logMessage, cleanLogData)
        break
      case PaymentLogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, cleanLogData)
        }
        break
      case PaymentLogLevel.INFO:
      default:
        console.log(logMessage, cleanLogData)
        break
    }
  }

  // Payment Creation Logging
  paymentCreated(molliePaymentId: string, data: {
    paymentId?: string
    subscriptionId?: string
    tenantId?: string
    amount?: number
    currency?: string
    planName?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.INFO,
      PaymentLogEvent.PAYMENT_CREATED,
      `Payment created in Mollie`,
      {
        molliePaymentId,
        paymentId: data.paymentId,
        subscriptionId: data.subscriptionId,
        tenantId: data.tenantId,
        metadata: {
          amount: data.amount,
          currency: data.currency,
          planName: data.planName
        }
      }
    ))
  }

  // Webhook Logging
  webhookReceived(molliePaymentId: string, data: {
    requestHeaders?: Record<string, string>
    requestBody?: any
    sourceIP?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.INFO,
      PaymentLogEvent.WEBHOOK_RECEIVED,
      `Webhook received from Mollie`,
      {
        molliePaymentId,
        metadata: {
          sourceIP: data.sourceIP,
          userAgent: data.requestHeaders?.['user-agent'],
          contentType: data.requestHeaders?.['content-type'],
          body: data.requestBody
        }
      }
    ))
  }

  webhookProcessed(molliePaymentId: string, data: {
    paymentId?: string
    subscriptionId?: string
    oldStatus?: string
    newStatus?: string
    duration?: number
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.INFO,
      PaymentLogEvent.WEBHOOK_PROCESSED,
      `Webhook processed successfully`,
      {
        molliePaymentId,
        paymentId: data.paymentId,
        subscriptionId: data.subscriptionId,
        duration: data.duration,
        metadata: {
          statusChange: data.oldStatus && data.newStatus ? `${data.oldStatus} -> ${data.newStatus}` : undefined
        }
      }
    ))
  }

  webhookFailed(molliePaymentId: string, error: Error | string, data?: {
    paymentId?: string
    duration?: number
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.ERROR,
      PaymentLogEvent.WEBHOOK_FAILED,
      `Webhook processing failed`,
      {
        molliePaymentId,
        paymentId: data?.paymentId,
        duration: data?.duration,
        error
      }
    ))
  }

  webhookMissing(molliePaymentId: string, data: {
    paymentId?: string
    createdAt?: string
    expectedBy?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.WARN,
      PaymentLogEvent.WEBHOOK_MISSING,
      `Webhook missing - payment will be reconciled`,
      {
        molliePaymentId,
        paymentId: data.paymentId,
        metadata: {
          createdAt: data.createdAt,
          expectedBy: data.expectedBy
        }
      }
    ))
  }

  // Reconciliation Logging
  reconciliationStarted(data: { 
    paymentCount?: number
    trigger?: 'cron' | 'manual' | 'timeout' | 'validation'
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.INFO,
      PaymentLogEvent.RECONCILIATION_STARTED,
      `Payment reconciliation started`,
      {
        metadata: {
          paymentCount: data.paymentCount,
          trigger: data.trigger
        }
      }
    ))
  }

  reconciliationSuccess(molliePaymentId: string, data: {
    paymentId?: string
    subscriptionId?: string
    oldStatus?: string
    newStatus?: string
    duration?: number
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.INFO,
      PaymentLogEvent.RECONCILIATION_SUCCESS,
      `Payment reconciliation successful`,
      {
        molliePaymentId,
        paymentId: data.paymentId,
        subscriptionId: data.subscriptionId,
        duration: data.duration,
        metadata: {
          statusChange: data.oldStatus && data.newStatus ? `${data.oldStatus} -> ${data.newStatus}` : undefined
        }
      }
    ))
  }

  reconciliationFailed(molliePaymentId: string, error: Error | string, data?: {
    paymentId?: string
    duration?: number
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.ERROR,
      PaymentLogEvent.RECONCILIATION_FAILED,
      `Payment reconciliation failed`,
      {
        molliePaymentId,
        paymentId: data?.paymentId,
        duration: data?.duration,
        error
      }
    ))
  }

  // Timeout Logging
  paymentTimeout(molliePaymentId: string, data: {
    paymentId?: string
    timeoutMs?: number
    trigger?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.WARN,
      PaymentLogEvent.PAYMENT_TIMEOUT,
      `Payment timeout triggered - webhook not received`,
      {
        molliePaymentId,
        paymentId: data.paymentId,
        metadata: {
          timeoutMs: data.timeoutMs,
          trigger: data.trigger
        }
      }
    ))
  }

  // Status Mismatch Logging
  statusMismatch(molliePaymentId: string, data: {
    paymentId?: string
    databaseStatus?: string
    mollieStatus?: string
    subscriptionId?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.WARN,
      PaymentLogEvent.STATUS_MISMATCH,
      `Payment status mismatch detected`,
      {
        molliePaymentId,
        paymentId: data.paymentId,
        subscriptionId: data.subscriptionId,
        metadata: {
          databaseStatus: data.databaseStatus,
          mollieStatus: data.mollieStatus
        }
      }
    ))
  }

  // Subscription Logging
  subscriptionActivated(subscriptionId: string, data: {
    paymentId?: string
    molliePaymentId?: string
    tenantId?: string
    planId?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.INFO,
      PaymentLogEvent.SUBSCRIPTION_ACTIVATED,
      `Subscription activated`,
      {
        subscriptionId,
        paymentId: data.paymentId,
        molliePaymentId: data.molliePaymentId,
        tenantId: data.tenantId,
        metadata: {
          planId: data.planId
        }
      }
    ))
  }

  subscriptionFailed(subscriptionId: string, error: Error | string, data?: {
    paymentId?: string
    molliePaymentId?: string
    tenantId?: string
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.ERROR,
      PaymentLogEvent.SUBSCRIPTION_FAILED,
      `Subscription activation failed`,
      {
        subscriptionId,
        paymentId: data?.paymentId,
        molliePaymentId: data?.molliePaymentId,
        tenantId: data?.tenantId,
        error
      }
    ))
  }

  // Debug Logging
  debug(event: PaymentLogEvent, message: string, data?: {
    paymentId?: string
    molliePaymentId?: string
    subscriptionId?: string
    metadata?: Record<string, any>
  }): void {
    this.log(this.createLogEntry(
      PaymentLogLevel.DEBUG,
      event,
      message,
      data
    ))
  }
}

// Singleton instance
export const paymentLogger = new PaymentLogger()
export default paymentLogger