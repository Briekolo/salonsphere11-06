'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  ArrowLeft,
  Download,
  Send,
  DollarSign,
  X,
  Edit,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Euro,
  Calendar,
  User,
  CreditCard,
  Loader2
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    address?: string;
  } | null;
  total_amount: number;
  subtotal: number;
  vat_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  issue_date: string;
  created_at: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    vat_rate: number;
    total: number;
  }>;
  payment_terms: string;
  payment_method?: string;
  notes?: string;
  footer_text?: string;
}

export default function InvoiceDetailPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId && invoiceId) {
      fetchInvoice();
    }
  }, [tenantId, invoiceId]);

  const fetchInvoice = async () => {
    if (!tenantId || !invoiceId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(
            id,
            first_name,
            last_name,
            email,
            address
          )
        `)
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;

      // Check if invoice is overdue
      const today = new Date();
      const dueDate = new Date(data.due_date);
      if (data.status === 'sent' && dueDate < today) {
        data.status = 'overdue';
      }

      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Kon factuur niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (newStatus: Invoice['status']) => {
    if (!invoice) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (error) throw error;

      setInvoice({ ...invoice, status: newStatus });
      
      // Show success message
      const statusMessages = {
        sent: 'Factuur is gemarkeerd als verzonden',
        paid: 'Factuur is gemarkeerd als betaald',
        cancelled: 'Factuur is geannuleerd'
      };
      console.log(statusMessages[newStatus as keyof typeof statusMessages]);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      setError('Kon status niet bijwerken');
    } finally {
      setUpdating(false);
    }
  };

  const downloadPDF = () => {
    // TODO: Implement PDF generation with a different library
    console.log('PDF generation coming soon');
  };

  const sendInvoiceEmail = async () => {
    if (!invoice) return;
    
    setUpdating(true);
    try {
      // TODO: Implement actual email sending
      await updateInvoiceStatus('sent');
      console.log('Email zou worden verstuurd naar:', invoice.client?.email);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { 
        label: 'Concept', 
        className: 'status-chip bg-gray-100 text-gray-800',
        icon: <FileText className="h-3 w-3" />
      },
      sent: { 
        label: 'Verzonden', 
        className: 'status-chip bg-icon-blue-bg text-icon-blue',
        icon: <Clock className="h-3 w-3" />
      },
      paid: { 
        label: 'Betaald', 
        className: 'status-chip bg-icon-green-bg text-icon-green',
        icon: <CheckCircle className="h-3 w-3" />
      },
      overdue: { 
        label: 'Verlopen', 
        className: 'status-chip bg-red-100 text-red-800',
        icon: <AlertCircle className="h-3 w-3" />
      },
      cancelled: { 
        label: 'Geannuleerd', 
        className: 'status-chip bg-gray-100 text-gray-800',
        icon: <X className="h-3 w-3" />
      }
    };

    const config = statusConfig[status];
    return (
      <span className={config.className}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mobile-p">
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Factuur niet gevonden'}
          </h3>
          <button
            onClick={() => router.push('/admin/billing')}
            className="btn-primary"
          >
            Terug naar overzicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-p max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/billing')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar facturen
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
            <div className="flex items-center gap-4 mt-2">
              {getStatusBadge(invoice.status)}
              <span className="text-gray-600">
                Uitgegeven op {new Date(invoice.issue_date).toLocaleDateString('nl-NL')}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary"
              title="Print factuur"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={downloadPDF}
              className="btn-secondary opacity-50 cursor-not-allowed"
              disabled
              title="PDF Download (Coming Soon)"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => router.push(`/admin/billing/${invoice.id}/edit`)}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4" />
              Bewerken
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons based on Status */}
      {invoice.status === 'draft' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl flex items-center justify-between">
          <p className="text-sm text-blue-800">
            Deze factuur is nog een concept en is niet verzonden naar de klant.
          </p>
          <button
            onClick={sendInvoiceEmail}
            disabled={updating}
            className="btn-primary"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Versturen...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Verstuur Factuur
              </>
            )}
          </button>
        </div>
      )}

      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-xl flex items-center justify-between">
          <p className="text-sm text-yellow-800">
            Wacht op betaling van de klant. Markeer als betaald wanneer ontvangen.
          </p>
          <button
            onClick={() => updateInvoiceStatus('paid')}
            disabled={updating}
            className="btn-primary"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verwerken...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                Markeer als Betaald
              </>
            )}
          </button>
        </div>
      )}

      {/* Invoice Content */}
      <div className="card print:shadow-none">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Client Info */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Klantgegevens
            </h3>
            {invoice.client ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {invoice.client.first_name} {invoice.client.last_name}
                </p>
                <p className="text-gray-600">{invoice.client.address || 'Geen adres opgegeven'}</p>
                <p className="text-gray-600">{invoice.client.email}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Geen klantgegevens beschikbaar</p>
            )}
          </div>

          {/* Invoice Info */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Factuurgegevens
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Factuurnummer:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Factuurdatum:</span>
                <span>{new Date(invoice.issue_date).toLocaleDateString('nl-NL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vervaldatum:</span>
                <span>{new Date(invoice.due_date).toLocaleDateString('nl-NL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Betalingstermijn:</span>
                <span>{invoice.payment_terms}</span>
              </div>
              {invoice.payment_method && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Betaalmethode:</span>
                  <span>
                    {invoice.payment_method === 'bank_transfer' ? 'Bank Overschrijving' :
                     invoice.payment_method === 'cash' ? 'Contant' :
                     invoice.payment_method === 'card' ? 'Pin/Creditcard' : 'Overig'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Factuurregels</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm font-medium text-gray-700">
                  <th className="text-left py-2">Omschrijving</th>
                  <th className="text-center py-2">Aantal</th>
                  <th className="text-right py-2">Prijs</th>
                  <th className="text-right py-2">BTW</th>
                  <th className="text-right py-2">Totaal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="text-sm">
                    <td className="py-3">{item.description}</td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">€{item.price.toFixed(2)}</td>
                    <td className="text-right py-3">{item.vat_rate}%</td>
                    <td className="text-right py-3">€{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={4} className="text-right py-2 font-medium">Subtotaal:</td>
                  <td className="text-right py-2">€{invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-right py-2 font-medium">BTW:</td>
                  <td className="text-right py-2">€{invoice.vat_amount.toFixed(2)}</td>
                </tr>
                <tr className="border-t text-lg font-bold">
                  <td colSpan={4} className="text-right py-2">Totaal:</td>
                  <td className="text-right py-2">€{invoice.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Opmerkingen</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        {invoice.footer_text && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">{invoice.footer_text}</p>
          </div>
        )}
      </div>

      {/* Status Actions */}
      {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => updateInvoiceStatus('cancelled')}
            disabled={updating}
            className="text-red-600 hover:text-red-700"
          >
            Annuleer Factuur
          </button>
        </div>
      )}
    </div>
  );
}