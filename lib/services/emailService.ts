import { supabase } from '@/lib/supabase';
import { PDFService } from './pdfService';
import { Invoice } from '@/types/invoice';

export class EmailService {
  // Send invoice email
  static async sendInvoiceEmail(invoice: Invoice, tenant: any): Promise<void> {
    try {
      // Generate PDF as base64
      const pdfBase64 = await PDFService.getInvoicePDFBase64(invoice, tenant);
      
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: invoice.client?.email,
          pdfBase64,
          tenantName: tenant.name,
          invoiceNumber: invoice.invoice_number,
          totalAmount: invoice.total_amount,
          dueDate: invoice.due_date
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  // Send payment reminder
  static async sendPaymentReminder(invoice: Invoice, tenant: any): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: invoice.client?.email,
          tenantName: tenant.name,
          invoiceNumber: invoice.invoice_number,
          totalAmount: invoice.total_amount,
          outstandingAmount: invoice.total_amount - invoice.paid_amount,
          dueDate: invoice.due_date,
          daysOverdue: Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  // Send payment confirmation
  static async sendPaymentConfirmation(invoice: Invoice, tenant: any, paymentAmount: number): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-payment-confirmation', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: invoice.client?.email,
          tenantName: tenant.name,
          invoiceNumber: invoice.invoice_number,
          paymentAmount,
          remainingAmount: invoice.total_amount - invoice.paid_amount - paymentAmount,
          isPaidInFull: (invoice.paid_amount + paymentAmount) >= invoice.total_amount
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }

  // Batch send invoices
  static async batchSendInvoices(invoiceIds: string[], tenant: any): Promise<{ success: string[]; failed: string[] }> {
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    for (const invoiceId of invoiceIds) {
      try {
        // Fetch invoice
        const { data: invoice, error } = await supabase
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
          .eq('id', invoiceId)
          .single();

        if (error) throw error;

        await this.sendInvoiceEmail(invoice, tenant);
        results.success.push(invoiceId);
      } catch (error) {
        console.error(`Failed to send invoice ${invoiceId}:`, error);
        results.failed.push(invoiceId);
      }
    }

    return results;
  }
}