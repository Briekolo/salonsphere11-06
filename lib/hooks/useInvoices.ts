import { useState, useEffect } from 'react';
import { InvoiceService } from '@/lib/services/invoiceService';
import { Invoice, InvoiceFilters, CreateInvoiceData, UpdateInvoiceData, AddPaymentData } from '@/types/invoice';
import { useTenant } from '@/lib/hooks/useTenant';

export function useInvoices(filters?: InvoiceFilters) {
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    console.log('[useInvoices] Effect triggered - tenant:', tenant);
    console.log('[useInvoices] tenant?.id:', tenant?.id);
    if (tenant?.id) {
      fetchInvoices();
    } else {
      setLoading(false); // Stop loading if no tenant
    }
  }, [tenant?.id, JSON.stringify(filters)]);

  const fetchInvoices = async () => {
    if (!tenant?.id) {
      console.log('[useInvoices] No tenant ID, returning');
      return;
    }
    
    console.log('[useInvoices] Fetching invoices for tenant:', tenant.id);
    setLoading(true);
    setError(null);
    
    try {
      const { data, count } = await InvoiceService.listInvoices({
        ...filters,
        tenant_id: tenant.id
      } as any);
      
      console.log('[useInvoices] Fetched invoices:', data?.length || 0, 'count:', count);
      setInvoices(data);
      setTotalCount(count);
    } catch (err) {
      console.error('[useInvoices] Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (data: Omit<CreateInvoiceData, 'tenant_id'>) => {
    if (!tenant?.id) throw new Error('No tenant context');
    
    const invoice = await InvoiceService.createInvoice({
      ...data,
      tenant_id: tenant.id
    });
    
    // Refresh list
    await fetchInvoices();
    return invoice;
  };

  const updateInvoice = async (invoiceId: string, updates: UpdateInvoiceData) => {
    const updated = await InvoiceService.updateInvoice(invoiceId, updates);
    
    // Update local state
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? updated : inv
    ));
    
    return updated;
  };

  const sendInvoice = async (invoiceId: string) => {
    await InvoiceService.sendInvoice(invoiceId);
    await fetchInvoices();
  };

  const cancelInvoice = async (invoiceId: string, reason?: string) => {
    await InvoiceService.cancelInvoice(invoiceId, reason);
    await fetchInvoices();
  };

  const addPayment = async (data: AddPaymentData) => {
    await InvoiceService.addPayment(data);
    await fetchInvoices();
  };

  return {
    invoices,
    loading,
    error,
    totalCount,
    createInvoice,
    updateInvoice,
    sendInvoice,
    cancelInvoice,
    addPayment,
    refetch: fetchInvoices
  };
}

export function useInvoice(invoiceId: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await InvoiceService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (updates: UpdateInvoiceData) => {
    const updated = await InvoiceService.updateInvoice(invoiceId, updates);
    setInvoice(updated);
    return updated;
  };

  const addItem = async (item: any) => {
    await InvoiceService.addInvoiceItem(invoiceId, item);
    await fetchInvoice();
  };

  const updateItem = async (itemId: string, updates: any) => {
    await InvoiceService.updateInvoiceItem(itemId, updates);
    await fetchInvoice();
  };

  const deleteItem = async (itemId: string) => {
    await InvoiceService.deleteInvoiceItem(itemId);
    await fetchInvoice();
  };

  const addPayment = async (data: Omit<AddPaymentData, 'invoice_id'>) => {
    await InvoiceService.addPayment({
      ...data,
      invoice_id: invoiceId
    });
    await fetchInvoice();
  };

  const deletePayment = async (paymentId: string) => {
    await InvoiceService.deletePayment(paymentId);
    await fetchInvoice();
  };

  return {
    invoice,
    loading,
    error,
    updateInvoice,
    addItem,
    updateItem,
    deleteItem,
    addPayment,
    deletePayment,
    refetch: fetchInvoice
  };
}

export function useInvoiceStats(dateRange?: { from: string; to: string }) {
  const { tenant } = useTenant();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant?.id) {
      fetchStats();
    }
  }, [tenant?.id, JSON.stringify(dateRange)]);

  const fetchStats = async () => {
    if (!tenant?.id) return;
    
    setLoading(true);
    
    try {
      const data = await InvoiceService.getInvoiceStats(tenant.id, dateRange);
      setStats(data);
    } catch (err) {
      console.error('Error fetching invoice stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
}