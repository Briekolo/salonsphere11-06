'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Plus, 
  Search,
  Download,
  Eye,
  Euro,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Send,
  DollarSign,
  X
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  issue_date: string;
  created_at: string;
  items: any[];
}

export default function BillingPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchInvoices();
    }
  }, [tenantId]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActionMenu(null);
    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionMenu]);

  const fetchInvoices = async () => {
    if (!tenantId) return;
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
            email
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check for overdue invoices and update status
      const updatedInvoices = (data || []).map(invoice => {
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        
        // Auto update overdue status for sent invoices
        if (invoice.status === 'sent' && dueDate < today) {
          return { ...invoice, status: 'overdue' };
        }
        return invoice;
      });

      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Update local state
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      ));

      // Show success message based on status
      const statusMessages = {
        sent: 'Factuur is gemarkeerd als verzonden',
        paid: 'Factuur is gemarkeerd als betaald',
        cancelled: 'Factuur is geannuleerd'
      };
      
      // You could add a toast notification here
      console.log(statusMessages[newStatus as keyof typeof statusMessages]);
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Weet u zeker dat u deze factuur wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      // Remove from local state
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
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
        icon: <AlertCircle className="h-3 w-3" />
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

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = invoice.client 
      ? `${invoice.client.first_name} ${invoice.client.last_name}`.toLowerCase()
      : '';
    return clientName.includes(searchTerm.toLowerCase()) ||
           invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total_amount, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total_amount, 0);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Totale Omzet',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: <Euro className="w-5 h-5" />,
      color: 'text-icon-green',
      bgColor: 'bg-icon-green-bg',
    },
    {
      title: 'Openstaand',
      value: `€${pendingAmount.toFixed(2)}`,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-icon-blue',
      bgColor: 'bg-icon-blue-bg',
    },
    {
      title: 'Verlopen',
      value: `€${overdueAmount.toFixed(2)}`,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Totaal Facturen',
      value: invoices.length.toString(),
      icon: <FileText className="w-5 h-5" />,
      color: 'text-icon-purple',
      bgColor: 'bg-icon-purple-bg',
    },
  ];

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturatie</h1>
          <p className="text-gray-600 mt-2">
            Beheer facturen en betalingen
          </p>
        </div>
        <button 
          onClick={() => router.push('/admin/billing/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Nieuwe Factuur
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric) => (
          <div key={metric.title} className="metric-card">
            <div className="flex items-start justify-between">
              <div className={`metric-icon ${metric.bgColor}`}>
                <div className={metric.color}>{metric.icon}</div>
              </div>
            </div>
            <div className="mt-4">
              <p className="metric-title">{metric.title}</p>
              <p className="metric-value">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek facturen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-heading">Facturen Overzicht</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factuur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bedrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vervaldatum
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(invoice.issue_date).toLocaleDateString('nl-NL')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.client 
                        ? `${invoice.client.first_name} ${invoice.client.last_name}`
                        : 'Geen klant'
                      }
                    </div>
                    {invoice.client && (
                      <div className="text-sm text-gray-500">{invoice.client.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">€{invoice.total_amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => router.push(`/admin/billing/${invoice.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Bekijk factuur"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          // TODO: Implement PDF generation with a different library
                          console.log('PDF generation coming soon');
                        }}
                        className="text-gray-400 hover:text-gray-600 opacity-50 cursor-not-allowed"
                        title="Download PDF (Coming Soon)"
                        disabled
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === invoice.id ? null : invoice.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {showActionMenu === invoice.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            {invoice.status === 'draft' && (
                              <button
                                onClick={() => {
                                  updateInvoiceStatus(invoice.id, 'sent');
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Send className="h-4 w-4" />
                                Markeer als Verzonden
                              </button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <button
                                onClick={() => {
                                  updateInvoiceStatus(invoice.id, 'paid');
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <DollarSign className="h-4 w-4" />
                                Markeer als Betaald
                              </button>
                            )}
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  updateInvoiceStatus(invoice.id, 'cancelled');
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <X className="h-4 w-4" />
                                Annuleer Factuur
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleDeleteInvoice(invoice.id);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                              <AlertCircle className="h-4 w-4" />
                              Verwijder
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Geen facturen gevonden</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Probeer een andere zoekopdracht.' : 'Maak uw eerste factuur aan.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}