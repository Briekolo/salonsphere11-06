import { supabase } from '@/lib/supabase';
import { 
  Invoice, 
  InvoiceItem, 
  InvoicePayment, 
  CreateInvoiceData, 
  UpdateInvoiceData, 
  AddPaymentData, 
  InvoiceFilters,
  InvoiceStatus 
} from '@/types/invoice';
import { NotificationTriggers } from './notificationTriggers';

export class InvoiceService {
  // Generate invoice number
  static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('generate_invoice_number', { p_tenant_id: tenantId });
    
    if (error) {
      // Fallback to timestamp-based number if function doesn't exist
      const timestamp = Date.now();
      return `INV-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
    }
    
    return data;
  }

  // Create invoice
  static async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(data.tenant_id);
      
      // Calculate due date (30 days default)
      const dueDate = data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: data.tenant_id,
          client_id: data.client_id,
          booking_id: data.booking_id,
          invoice_number: invoiceNumber,
          due_date: dueDate,
          notes: data.notes,
          tax_rate: data.tax_rate || 21.00, // Dutch BTW
          discount_amount: data.discount_amount || 0,
          status: 'draft' as InvoiceStatus
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Add invoice items
      if (data.items && data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          invoice_id: invoice.id,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          sort_order: index
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Fetch complete invoice with relations
      return await this.getInvoiceById(invoice.id);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Create invoice from booking
  static async createInvoiceFromBooking(bookingId: string): Promise<Invoice> {
    try {
      // Fetch booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            name,
            price,
            duration_minutes
          ),
          clients (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Create invoice data
      const invoiceData: CreateInvoiceData = {
        tenant_id: booking.tenant_id,
        client_id: booking.client_id,
        booking_id: bookingId,
        items: [{
          service_id: booking.service_id,
          description: booking.services.name,
          quantity: 1,
          unit_price: booking.services.price
        }]
      };

      return await this.createInvoice(invoiceData);
    } catch (error) {
      console.error('Error creating invoice from booking:', error);
      throw error;
    }
  }

  // Get invoice by ID
  static async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email,
          phone,
          address
        ),
        bookings (
          id,
          scheduled_at,
          service_id,
          staff_id
        ),
        items:invoice_items (
          *,
          services (
            id,
            name,
            category
          )
        ),
        payments:invoice_payments (
          *,
          created_by_user:users!created_by (
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    return data;
  }

  // List invoices with filters
  static async listInvoices(filters: InvoiceFilters): Promise<{ data: Invoice[]; count: number }> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });

    // Apply tenant filter (required for multi-tenancy)
    if (filters.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    
    if (filters.date_from) {
      query = query.gte('issue_date', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('issue_date', filters.date_to);
    }
    
    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,clients.email.ilike.%${filters.search}%`);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Default ordering
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  // Update invoice
  static async updateInvoice(invoiceId: string, updates: UpdateInvoiceData): Promise<Invoice> {
    const { error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) throw error;
    return await this.getInvoiceById(invoiceId);
  }

  // Add invoice item
  static async addInvoiceItem(invoiceId: string, item: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoiceId,
        ...item,
        total_price: item.quantity * item.unit_price
      });

    if (error) throw error;
  }

  // Update invoice item
  static async updateInvoiceItem(itemId: string, updates: Partial<InvoiceItem>): Promise<void> {
    const updateData: any = { ...updates };
    
    // Recalculate total if quantity or unit_price changed
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const { data: currentItem } = await supabase
        .from('invoice_items')
        .select('quantity, unit_price')
        .eq('id', itemId)
        .single();
      
      if (currentItem) {
        const quantity = updates.quantity ?? currentItem.quantity;
        const unitPrice = updates.unit_price ?? currentItem.unit_price;
        updateData.total_price = quantity * unitPrice;
      }
    }

    const { error } = await supabase
      .from('invoice_items')
      .update(updateData)
      .eq('id', itemId);

    if (error) throw error;
  }

  // Delete invoice item
  static async deleteInvoiceItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  // Add payment
  static async addPayment(data: AddPaymentData): Promise<void> {
    const { data: payment, error } = await supabase
      .from('invoice_payments')
      .insert({
        ...data,
        payment_date: data.payment_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    // Get invoice details for notification
    try {
      const invoice = await this.getInvoiceById(data.invoice_id);
      
      await NotificationTriggers.onPaymentReceived(
        invoice.tenant_id,
        data.created_by, // The user who recorded the payment
        {
          id: payment.id,
          amount: data.amount,
          client_name: `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim(),
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          payment_method: data.payment_method,
          payment_date: payment.payment_date
        }
      );
    } catch (notificationError) {
      console.error('Failed to send notification for payment received:', notificationError);
      // Don't fail the payment recording if notification fails
    }
  }

  // Delete payment
  static async deletePayment(paymentId: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  }

  // Send invoice
  static async sendInvoice(invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'sent' as InvoiceStatus,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) throw error;
    
    // TODO: Trigger email sending via Edge Function
  }

  // Mark invoice as viewed
  static async markAsViewed(invoiceId: string): Promise<void> {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();
    
    // Only update if status is 'sent'
    if (invoice?.status === 'sent') {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'viewed' as InvoiceStatus,
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;
    }
  }

  // Cancel invoice
  static async cancelInvoice(invoiceId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled' as InvoiceStatus,
        cancelled_at: new Date().toISOString(),
        internal_notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) throw error;
  }

  // Get invoice statistics
  static async getInvoiceStats(tenantId: string, dateRange?: { from: string; to: string }) {
    let query = supabase
      .from('invoices')
      .select('status, total_amount, paid_amount')
      .eq('tenant_id', tenantId);
    
    if (dateRange) {
      query = query
        .gte('issue_date', dateRange.from)
        .lte('issue_date', dateRange.to);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      byStatus: {} as Record<InvoiceStatus, number>
    };
    
    data?.forEach(invoice => {
      stats.totalAmount += invoice.total_amount;
      stats.paidAmount += invoice.paid_amount;
      stats.byStatus[invoice.status] = (stats.byStatus[invoice.status] || 0) + 1;
    });
    
    stats.outstandingAmount = stats.totalAmount - stats.paidAmount;
    
    return stats;
  }

  // Check and mark overdue invoices
  static async checkOverdueInvoices(tenantId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // First, get the invoices that will become overdue
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        due_date,
        clients (
          id,
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', tenantId)
      .in('status', ['sent', 'viewed', 'partially_paid'])
      .lt('due_date', today);
    
    // Update their status to overdue
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'overdue' as InvoiceStatus,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .in('status', ['sent', 'viewed', 'partially_paid'])
      .lt('due_date', today);
    
    if (error) throw error;

    // Send notifications for each overdue invoice
    if (overdueInvoices && overdueInvoices.length > 0) {
      for (const invoice of overdueInvoices) {
        try {
          await NotificationTriggers.onPaymentOverdue(
            tenantId,
            null, // Broadcast to all users in tenant
            {
              id: invoice.id,
              number: invoice.invoice_number,
              total: invoice.total_amount,
              due_date: invoice.due_date,
              client_name: `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim()
            }
          );
        } catch (notificationError) {
          console.error('Failed to send overdue payment notification:', notificationError);
          // Continue with other notifications even if one fails
        }
      }
    }
  }
}