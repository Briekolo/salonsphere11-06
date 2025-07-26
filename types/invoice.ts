export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod = 
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'ideal'
  | 'paypal'
  | 'other';

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  booking_id?: string;
  client_id: string;
  
  // Invoice details
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  
  // Financial details
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  
  // Additional info
  notes?: string;
  internal_notes?: string;
  
  // Metadata
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  cancelled_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address?: string;
  };
  booking?: {
    id: string;
    scheduled_at: string;
    service_id: string;
    staff_id?: string;
  };
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id?: string;
  
  // Item details
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  
  // Order
  sort_order: number;
  
  created_at: string;
  
  // Relations
  service?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  
  // Payment details
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference?: string;
  notes?: string;
  
  created_at: string;
  created_by?: string;
  
  // Relations
  created_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface InvoiceSequence {
  tenant_id: string;
  year: number;
  last_number: number;
}

export interface CreateInvoiceData {
  tenant_id: string;
  client_id: string;
  booking_id?: string;
  due_date?: string;
  notes?: string;
  items: {
    service_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  discount_amount?: number;
  tax_rate?: number;
}

export interface UpdateInvoiceData {
  due_date?: string;
  notes?: string;
  internal_notes?: string;
  discount_amount?: number;
  tax_rate?: number;
  status?: InvoiceStatus;
}

export interface AddPaymentData {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  client_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}