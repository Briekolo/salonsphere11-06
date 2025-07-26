'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoice } from '@/lib/hooks/useInvoices';
import { useTenant } from '@/lib/hooks/useTenant';
import { PDFService } from '@/lib/services/pdfService';
import { EmailService } from '@/lib/services/emailService';
import { PaymentMethod, InvoiceStatus } from '@/types/invoice';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  ArrowLeft,
  Download,
  Send,
  Eye,
  Edit,
  Euro,
  Calendar,
  Mail,
  Phone,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
  CreditCard,
  Loader2,
  X
} from 'lucide-react';

interface InvoiceDetailContentProps {
  invoiceId: string;
}

export function InvoiceDetailContent({ invoiceId }: InvoiceDetailContentProps) {
  const router = useRouter();
  const { tenant } = useTenant();
  const { invoice, loading, error, addPayment, deletePayment, updateInvoice } = useInvoice(invoiceId);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer' as PaymentMethod,
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'sent':
        return <Send className="w-5 h-5 text-blue-500" />;
      case 'viewed':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'partially_paid':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
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

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return 'Contant';
      case 'card': return 'Kaart';
      case 'bank_transfer': return 'Bankoverschrijving';
      case 'ideal': return 'iDEAL';
      case 'paypal': return 'PayPal';
      case 'other': return 'Overig';
      default: return method;
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice || !tenant) return;
    
    setSendingEmail(true);
    try {
      await EmailService.sendInvoiceEmail(invoice, tenant);
      alert('Factuur succesvol verzonden');
      window.location.reload();
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Er is een fout opgetreden bij het verzenden van de factuur');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !tenant) return;
    
    setDownloadingPDF(true);
    try {
      await PDFService.downloadInvoicePDF(invoice, tenant);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Er is een fout opgetreden bij het downloaden van de PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addPayment({
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined
      });
      
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Er is een fout opgetreden bij het toevoegen van de betaling');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Weet u zeker dat u deze betaling wilt verwijderen?')) return;
    
    try {
      await deletePayment(paymentId);
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de betaling');
    }
  };

  const handleCancelInvoice = async () => {
    if (!confirm('Weet u zeker dat u deze factuur wilt annuleren?')) return;
    
    try {
      await updateInvoice({ status: 'cancelled' as InvoiceStatus });
      alert('Factuur geannuleerd');
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      alert('Er is een fout opgetreden bij het annuleren van de factuur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-gray-600">Factuur laden...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Factuur niet gevonden</h3>
        <button
          onClick={() => router.push('/invoices')}
          className="text-[#02011F] hover:underline"
        >
          Terug naar overzicht
        </button>
      </div>
    );
  }

  const remainingAmount = invoice.total_amount - invoice.paid_amount;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/invoices')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#010009] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Terug naar overzicht</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-medium text-[#010009] mb-2" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
              {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-3">
              {getStatusIcon(invoice.status)}
              <span className="text-lg">{getStatusLabel(invoice.status)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              {downloadingPDF ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download PDF
            </button>
            
            {invoice.status === 'draft' && (
              <button
                onClick={handleSendInvoice}
                disabled={sendingEmail}
                className="px-4 py-2 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Verzend factuur
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-[#010009] mb-4">Factuurgegevens</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Factuurdatum</p>
                <p className="font-medium text-[#010009]">
                  {format(new Date(invoice.issue_date), 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vervaldatum</p>
                <p className="font-medium text-[#010009]">
                  {format(new Date(invoice.due_date), 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Klant</p>
                <p className="font-medium text-[#010009]">
                  {invoice.client?.first_name} {invoice.client?.last_name}
                </p>
                <p className="text-sm text-gray-600">{invoice.client?.email}</p>
                <p className="text-sm text-gray-600">{invoice.client?.phone}</p>
              </div>
              {invoice.booking && (
                <div>
                  <p className="text-sm text-gray-600">Gekoppelde afspraak</p>
                  <p className="font-medium text-[#010009]">
                    {format(new Date(invoice.booking.scheduled_at), 'd MMMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
              )}
            </div>

            {invoice.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Opmerkingen</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-[#010009] mb-4">Factuurregels</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-700">Omschrijving</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-700">Aantal</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700">Prijs</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700">Totaal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">€ {item.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium">€ {item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={3} className="py-3 text-right text-sm">Subtotaal</td>
                    <td className="py-3 text-right">€ {invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  {invoice.discount_amount > 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-right text-sm">Korting</td>
                      <td className="py-3 text-right">- € {invoice.discount_amount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="py-3 text-right text-sm">BTW ({invoice.tax_rate}%)</td>
                    <td className="py-3 text-right">€ {invoice.tax_amount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t font-medium">
                    <td colSpan={3} className="py-3 text-right">Totaal</td>
                    <td className="py-3 text-right text-lg">€ {invoice.total_amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#010009]">Betalingen</h2>
              {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                <button
                  onClick={() => {
                    setPaymentForm(prev => ({ ...prev, amount: remainingAmount.toFixed(2) }));
                    setShowPaymentModal(true);
                  }}
                  className="px-3 py-1.5 bg-[#02011F] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Betaling toevoegen
                </button>
              )}
            </div>

            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">€ {payment.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            {getPaymentMethodLabel(payment.payment_method)} - {format(new Date(payment.payment_date), 'd MMM yyyy', { locale: nl })}
                          </p>
                          {payment.reference && (
                            <p className="text-sm text-gray-600">Ref: {payment.reference}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Verwijder betaling"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">Nog geen betalingen ontvangen</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-[#010009] mb-4">Betalingsoverzicht</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Totaalbedrag</span>
                <span className="font-medium">€ {invoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Betaald</span>
                <span className="font-medium text-green-600">€ {invoice.paid_amount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Openstaand</span>
                  <span className="font-medium text-lg text-red-600">€ {remainingAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {remainingAmount > 0 && (
              <button
                onClick={() => {
                  setPaymentForm(prev => ({ ...prev, amount: remainingAmount.toFixed(2) }));
                  setShowPaymentModal(true);
                }}
                className="w-full mt-4 px-4 py-2 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
              >
                Betaling registreren
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-[#010009] mb-4">Acties</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => PDFService.previewInvoicePDF(invoice, tenant)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Bekijk PDF
              </button>
              
              {invoice.status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Bewerk factuur
                  </button>
                  
                  <button
                    onClick={handleCancelInvoice}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Annuleer factuur
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-[#010009] mb-4">Tijdlijn</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Aangemaakt</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(invoice.created_at), 'd MMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
              </div>
              
              {invoice.sent_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Verzonden</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.sent_at), 'd MMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                </div>
              )}
              
              {invoice.viewed_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Bekeken</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.viewed_at), 'd MMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                </div>
              )}
              
              {invoice.paid_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Betaald</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.paid_at), 'd MMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                </div>
              )}
              
              {invoice.cancelled_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Geannuleerd</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.cancelled_at), 'd MMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-[#010009]">Betaling toevoegen</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrag
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    required
                    max={remainingAmount}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betaalmethode
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                >
                  <option value="cash">Contant</option>
                  <option value="card">Kaart</option>
                  <option value="bank_transfer">Bankoverschrijving</option>
                  <option value="ideal">iDEAL</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Overig</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betaaldatum
                </label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referentie (optioneel)
                </label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                  placeholder="Bijv. transactienummer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notities (optioneel)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                  placeholder="Eventuele opmerkingen..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
                >
                  Betaling toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}