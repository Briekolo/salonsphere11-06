'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices, useInvoiceStats } from '@/lib/hooks/useInvoices';
import { EmailService } from '@/lib/services/emailService';
import { useTenant } from '@/lib/hooks/useTenant';
import { InvoiceFilters, InvoiceStatus } from '@/types/invoice';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Euro,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Loader2
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export function InvoicesContent() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [sendingInvoices, setSendingInvoices] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<InvoiceFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  
  const { invoices, loading, totalCount, refetch } = useInvoices({
    ...filters,
    search: searchTerm,
    status: selectedStatus.length > 0 ? selectedStatus : undefined,
    date_from: dateRange.from,
    date_to: dateRange.to,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE
  });
  
  const { stats } = useInvoiceStats(dateRange.from && dateRange.to ? dateRange : undefined);
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'partially_paid':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'sent': return 'Verzonden';
      case 'viewed': return 'Bekeken';
      case 'partially_paid': return 'Gedeeltelijk betaald';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Vervallen';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  const handleBatchSend = async () => {
    if (!tenant || selectedInvoices.length === 0) return;
    
    setSendingInvoices(true);
    try {
      const results = await EmailService.batchSendInvoices(selectedInvoices, tenant);
      
      if (results.success.length > 0) {
        alert(`${results.success.length} facturen succesvol verzonden`);
      }
      
      if (results.failed.length > 0) {
        alert(`${results.failed.length} facturen konden niet worden verzonden`);
      }
      
      setSelectedInvoices([]);
      refetch();
    } catch (error) {
      console.error('Error sending invoices:', error);
      alert('Er is een fout opgetreden bij het verzenden van de facturen');
    } finally {
      setSendingInvoices(false);
    }
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleAllInvoices = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(inv => inv.id));
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-gray-600">Facturen laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-medium text-[#010009]" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
            Facturen
          </h1>
          <button
            onClick={() => router.push('/invoices/new')}
            className="px-3 sm:px-4 py-2 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center min-h-[40px]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Nieuwe factuur</span>
            <span className="xs:hidden">Nieuw</span>
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">Totaal facturen</p>
              <p className="text-xl sm:text-2xl font-medium text-[#010009]">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">Totaal bedrag</p>
              <div className="flex items-center gap-1">
                <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <p className="text-lg sm:text-2xl font-medium text-[#010009]">{stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">Ontvangen</p>
              <div className="flex items-center gap-1">
                <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <p className="text-lg sm:text-2xl font-medium text-green-600">{stats.paidAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">Openstaand</p>
              <div className="flex items-center gap-1">
                <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <p className="text-lg sm:text-2xl font-medium text-red-600">{stats.outstandingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            {/* Search */}
            <div className="w-full sm:flex-1 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent text-sm sm:text-base min-h-[40px]"
                />
              </div>
            </div>

            {/* Status filter */}
            <select
              value={selectedStatus.join(',')}
              onChange={(e) => setSelectedStatus(e.target.value ? e.target.value.split(',') as InvoiceStatus[] : [])}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent text-sm sm:text-base min-h-[40px] w-full sm:w-auto"
            >
              <option value="">Alle statussen</option>
              <option value="draft">Concept</option>
              <option value="sent">Verzonden</option>
              <option value="viewed">Bekeken</option>
              <option value="partially_paid">Gedeeltelijk betaald</option>
              <option value="paid">Betaald</option>
              <option value="overdue">Vervallen</option>
              <option value="cancelled">Geannuleerd</option>
            </select>

            {/* Date range */}
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent text-sm sm:text-base min-h-[40px] flex-1"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent text-sm sm:text-base min-h-[40px] flex-1"
              />
            </div>
          </div>

          {/* Bulk actions */}
          {selectedInvoices.length > 0 && (
            <div className="flex items-center gap-4 pt-2 border-t">
              <span className="text-sm text-gray-600">
                {selectedInvoices.length} geselecteerd
              </span>
              <button
                onClick={handleBatchSend}
                disabled={sendingInvoices}
                className="px-4 py-2 bg-[#02011F] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                {sendingInvoices ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Verzend geselecteerde
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    onChange={toggleAllInvoices}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nummer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Klant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vervaldatum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Bedrag</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr 
                  key={invoice.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => toggleInvoiceSelection(invoice.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-[#010009]">{invoice.invoice_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-[#010009]">
                        {invoice.client?.first_name} {invoice.client?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{invoice.client?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {format(new Date(invoice.issue_date), 'd MMM yyyy', { locale: nl })}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {format(new Date(invoice.due_date), 'd MMM yyyy', { locale: nl })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <span className="text-sm">{getStatusLabel(invoice.status)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Euro className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">{invoice.total_amount.toFixed(2)}</span>
                    </div>
                    {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                      <p className="text-xs text-gray-600">
                        € {invoice.paid_amount.toFixed(2)} betaald
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Bekijk factuur"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Verzend factuur"
                        >
                          <Send className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Pagina {currentPage} van {totalPages} ({totalCount} facturen)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-3">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/invoices/${invoice.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[#010009]">{invoice.invoice_number}</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    <span className="text-xs sm:text-sm">{getStatusLabel(invoice.status)}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#010009]">
                  {invoice.client?.first_name} {invoice.client?.last_name}
                </p>
                <p className="text-xs text-gray-600">{invoice.client?.email}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Euro className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  <span className="font-medium text-sm sm:text-base">{invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
              <span>{format(new Date(invoice.issue_date), 'd MMM yyyy', { locale: nl })}</span>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedInvoices.includes(invoice.id)}
                  onChange={() => toggleInvoiceSelection(invoice.id)}
                  className="rounded border-gray-300"
                />
                <button
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - Mobile */}
      {totalPages > 1 && (
        <div className="lg:hidden flex items-center justify-between mt-4 px-2">
          <p className="text-xs sm:text-sm text-gray-600">
            Pagina {currentPage}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {invoices.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen facturen gevonden</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedStatus.length > 0 
              ? 'Probeer andere zoektermen of filters'
              : 'Maak uw eerste factuur aan'}
          </p>
          {!searchTerm && selectedStatus.length === 0 && (
            <button
              onClick={() => router.push('/invoices/new')}
              className="px-4 py-2 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
            >
              Nieuwe factuur maken
            </button>
          )}
        </div>
      )}
    </div>
  );
}