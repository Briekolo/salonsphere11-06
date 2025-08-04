import { createMollieClient, MollieClient, Payment, Customer } from '@mollie/api-client'

export interface MolliePaymentRequest {
  amount: {
    currency: string
    value: string
  }
  description: string
  redirectUrl: string
  webhookUrl?: string
  metadata?: Record<string, string>
  customerId?: string
}

export interface MollieCustomerRequest {
  name: string
  email: string
  metadata?: Record<string, string>
}

class MollieService {
  private client: MollieClient
  private initialized = false

  constructor() {
    // Initialize client when first used
    this.initClient()
  }

  private initClient() {
    if (this.initialized) return

    const apiKey = process.env.MOLLIE_API_KEY
    if (!apiKey) {
      throw new Error('MOLLIE_API_KEY environment variable is required')
    }

    this.client = createMollieClient({ apiKey })
    this.initialized = true
  }

  /**
   * Create a new customer in Mollie
   */
  async createCustomer(customerData: MollieCustomerRequest): Promise<Customer> {
    this.initClient()
    
    try {
      const customer = await this.client.customers.create({
        name: customerData.name,
        email: customerData.email,
        metadata: customerData.metadata
      })
      
      return customer
    } catch (error) {
      console.error('Error creating Mollie customer:', error)
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer> {
    this.initClient()
    
    try {
      const customer = await this.client.customers.get(customerId)
      return customer
    } catch (error) {
      console.error('Error fetching Mollie customer:', error)
      throw new Error(`Failed to fetch customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a payment in Mollie
   */
  async createPayment(paymentData: MolliePaymentRequest): Promise<Payment> {
    this.initClient()
    
    try {
      const payment = await this.client.payments.create({
        amount: paymentData.amount,
        description: paymentData.description,
        redirectUrl: paymentData.redirectUrl,
        webhookUrl: paymentData.webhookUrl,
        metadata: paymentData.metadata,
        customerId: paymentData.customerId
      })
      
      return payment
    } catch (error) {
      console.error('Error creating Mollie payment:', error)
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    this.initClient()
    
    try {
      const payment = await this.client.payments.get(paymentId)
      return payment
    } catch (error) {
      console.error('Error fetching Mollie payment:', error)
      throw new Error(`Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Format amount for Mollie (from cents to decimal string)
   */
  formatAmount(cents: number, currency: string = 'EUR'): { value: string; currency: string } {
    const value = (cents / 100).toFixed(2)
    return { value, currency }
  }

  /**
   * Parse amount from Mollie (from decimal string to cents)
   */
  parseAmount(mollieAmount: { value: string; currency: string }): number {
    return Math.round(parseFloat(mollieAmount.value) * 100)
  }

  /**
   * Check if payment is successful
   */
  isPaymentSuccessful(payment: Payment): boolean {
    return payment.status === 'paid' || payment.status === 'authorized'
  }

  /**
   * Check if payment failed
   */
  isPaymentFailed(payment: Payment): boolean {
    return payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired'
  }

  /**
   * Get payment status for internal use
   */
  getInternalPaymentStatus(mollieStatus: string): 'pending' | 'paid' | 'failed' | 'cancelled' {
    switch (mollieStatus) {
      case 'paid':
      case 'authorized':
        return 'paid'
      case 'failed':
      case 'expired':
        return 'failed'
      case 'canceled':
        return 'cancelled'
      case 'pending':
      case 'open':
      default:
        return 'pending'
    }
  }

  /**
   * Generate webhook URL for environment
   */
  getWebhookUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    if (!baseUrl) {
      // For development, use localhost
      return 'http://localhost:3000/api/webhooks/mollie'
    }
    
    // Ensure URL has protocol
    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    return `${url}/api/webhooks/mollie`
  }

  /**
   * Generate redirect URL for payment success
   */
  getSuccessUrl(tenantId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    return `${url}/subscription?success=true`
  }

  /**
   * Generate redirect URL for payment failure
   */
  getFailureUrl(tenantId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    return `${url}/subscription?error=payment_failed`
  }
}

export const mollieService = new MollieService()
export default mollieService