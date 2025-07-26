'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  User, 
  Calendar,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Calculator,
  Euro,
  Send,
  Download,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  vat_rate: number;
  total: number;
}

interface InvoiceFormData {
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  items: InvoiceItem[];
  notes: string;
  footer_text: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  address?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
}

const VAT_RATES = [
  { value: 21, label: '21% (Standaard)' },
  { value: 9, label: '9% (Verlaagd)' },
  { value: 0, label: '0% (Vrijgesteld)' }
];

export default function NewInvoicePage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const router = useRouter();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: 'Net 30',
    items: [{
      id: '1',
      description: '',
      quantity: 1,
      price: 0,
      vat_rate: 21,
      total: 0
    }],
    notes: '',
    footer_text: 'Gelieve het bedrag binnen 30 dagen over te maken onder vermelding van het factuurnummer.'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchClients();
      fetchServices();
      generateInvoiceNumber();
    }
  }, [tenantId]);

  const fetchClients = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, address')
        .eq('tenant_id', tenantId)
        .order('first_name');

      if (error) throw error;
      
      setClients(data || []);
    } catch (err) {
      setError('Kon klanten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, category')
        .eq('tenant_id', tenantId)
        .order('category, name');

      if (error) throw error;
      
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const generateInvoiceNumber = async () => {
    if (!tenantId) return;
    
    try {
      // Get the latest invoice number
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const year = new Date().getFullYear();
      let nextNumber = 1;

      if (data && data.length > 0) {
        // Extract number from format INV-YYYY-XXXX
        const lastNumber = data[0].invoice_number.split('-')[2];
        nextNumber = parseInt(lastNumber) + 1;
      }

      setFormData(prev => ({
        ...prev,
        invoice_number: `INV-${year}-${String(nextNumber).padStart(4, '0')}`
      }));
    } catch (err) {
      // Fallback to random number if error
      const year = new Date().getFullYear();
      const number = Math.floor(Math.random() * 1000) + 1;
      setFormData(prev => ({
        ...prev,
        invoice_number: `INV-${year}-${String(number).padStart(4, '0')}`
      }));
    }
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Calculate total for the item
    if (field === 'quantity' || field === 'price' || field === 'vat_rate') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const price = field === 'price' ? value : newItems[index].price;
      const vatRate = field === 'vat_rate' ? value : newItems[index].vat_rate;
      
      const subtotal = quantity * price;
      const vat = subtotal * (vatRate / 100);
      newItems[index].total = subtotal + vat;
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          price: 0,
          vat_rate: 21,
          total: 0
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const vatAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.price;
      return sum + (itemSubtotal * (item.vat_rate / 100));
    }, 0);
    const total = subtotal + vatAmount;

    return { subtotal, vatAmount, total };
  };

  const handleSave = async (sendEmail = false) => {
    if (!tenantId) return;
    
    setError(null);
    setSaving(true);

    try {
      const totals = calculateTotals();
      
      // Prepare invoice data for database
      const invoiceData = {
        tenant_id: tenantId,
        client_id: formData.client_id,
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        status: sendEmail ? 'sent' : 'draft',
        payment_terms: formData.payment_terms,
        payment_method: paymentMethod,
        items: formData.items.filter(item => item.description && item.quantity > 0),
        subtotal: totals.subtotal,
        vat_amount: totals.vatAmount,
        total_amount: totals.total,
        notes: formData.notes,
        footer_text: formData.footer_text,
        created_at: new Date().toISOString(),
        created_by: null // TODO: Add current user ID when auth is implemented
      };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;
      
      if (sendEmail && data) {
        setSendingEmail(true);
        // TODO: Implement email sending logic
        // For now, just update status to sent
        await supabase
          .from('invoices')
          .update({ status: 'sent' })
          .eq('id', data.id);
        setSendingEmail(false);
      }
      
      // Redirect to billing list or invoice detail
      router.push('/admin/billing');
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      setError(err.message || 'Er is een fout opgetreden bij het opslaan van de factuur');
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const { subtotal, vatAmount, total } = calculateTotals();

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-p max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/billing')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar facturen
        </button>
        
        <h1 className="text-3xl font-bold tracking-tight">Nieuwe Factuur</h1>
        <p className="text-gray-600 mt-2">
          Maak een nieuwe factuur aan voor een klant
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
        {/* Invoice Details */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h2 className="text-heading">Factuur Details</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factuurnummer *
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klant *
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Selecteer een klant</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name} - {client.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factuurdatum *
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleInputChange('issue_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vervaldatum *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {selectedClient && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Factuuradres:</p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedClient.first_name} {selectedClient.last_name}<br />
                {selectedClient.address || 'Geen adres opgegeven'}<br />
                {selectedClient.email}
              </p>
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading">Factuurregels</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              Regel toevoegen
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-700 border-b">
                  <th className="pb-2 pr-4" colSpan={2}>Service / Omschrijving</th>
                  <th className="pb-2 px-4 text-center">Aantal</th>
                  <th className="pb-2 px-4 text-right">Prijs</th>
                  <th className="pb-2 px-4">BTW</th>
                  <th className="pb-2 px-4 text-right">Totaal</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formData.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const service = services.find(s => s.id === e.target.value);
                          if (service) {
                            handleItemChange(index, 'description', service.name);
                            handleItemChange(index, 'price', service.price);
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Selecteer service...</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - €{service.price.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Of typ eigen omschrijving"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.5"
                        className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative">
                        <Euro className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-24 pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.vat_rate}
                        onChange={(e) => handleItemChange(index, 'vat_rate', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {VAT_RATES.map((rate) => (
                          <option key={rate.value} value={rate.value}>
                            {rate.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium">€ {item.total.toFixed(2)}</span>
                    </td>
                    <td className="py-3 pl-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2">
                <tr>
                  <td colSpan={4} className="py-2 text-right font-medium">Subtotaal:</td>
                  <td className="py-2 px-4 text-right">€ {subtotal.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-2 text-right font-medium">BTW:</td>
                  <td className="py-2 px-4 text-right">€ {vatAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="text-lg font-bold">
                  <td colSpan={4} className="py-2 text-right">Totaal:</td>
                  <td className="py-2 px-4 text-right">€ {total.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Method */}
        <div className="card">
          <h2 className="text-heading mb-4">Betaalmethode</h2>
          
          <div className="grid gap-3 md:grid-cols-3">
            <label className="relative">
              <input
                type="radio"
                name="payment_method"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="peer sr-only"
              />
              <div className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 peer-checked:border-primary-500 peer-checked:bg-primary-50">
                <Euro className="h-5 w-5 text-gray-600 peer-checked:text-primary-600" />
                <div>
                  <p className="font-medium">Bank Overschrijving</p>
                  <p className="text-sm text-gray-500">Betaling via bank</p>
                </div>
              </div>
            </label>
            
            <label className="relative">
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="peer sr-only"
              />
              <div className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 peer-checked:border-primary-500 peer-checked:bg-primary-50">
                <Euro className="h-5 w-5 text-gray-600 peer-checked:text-primary-600" />
                <div>
                  <p className="font-medium">Contant</p>
                  <p className="text-sm text-gray-500">Contante betaling</p>
                </div>
              </div>
            </label>
            
            <label className="relative">
              <input
                type="radio"
                name="payment_method"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="peer sr-only"
              />
              <div className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 peer-checked:border-primary-500 peer-checked:bg-primary-50">
                <Euro className="h-5 w-5 text-gray-600 peer-checked:text-primary-600" />
                <div>
                  <p className="font-medium">Pin/Creditcard</p>
                  <p className="text-sm text-gray-500">Elektronische betaling</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="text-heading mb-4">Aanvullende Informatie</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Betalingstermijn
              </label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Net 30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opmerkingen
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Eventuele opmerkingen voor deze factuur"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voettekst
              </label>
              <textarea
                value={formData.footer_text}
                onChange={(e) => handleInputChange('footer_text', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/billing')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Annuleren
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                console.log('Preview clicked', { 
                  showPreview, 
                  client_id: formData.client_id, 
                  items: formData.items,
                  hasDescription: formData.items.filter(item => item.description).length 
                });
                setShowPreview(true);
              }}
              disabled={!formData.client_id || formData.items.filter(item => item.description).length === 0}
              className="btn-secondary"
            >
              <Eye className="h-4 w-4" />
              Voorbeeld
            </button>
            
            <button
              type="submit"
              disabled={saving || !formData.client_id || formData.items.length === 0}
              className="btn-secondary"
            >
              {saving && !sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Opslaan als Concept
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !formData.client_id || formData.items.length === 0}
              className="btn-primary"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Versturen...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Opslaan & Versturen
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Invoice Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Factuur Voorbeeld</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Invoice Preview Content */}
              <div className="bg-white">
                {/* Header */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">FACTUUR</h1>
                    <p className="text-gray-600">Factuurnummer: {formData.invoice_number}</p>
                    <p className="text-gray-600">Datum: {new Date(formData.issue_date).toLocaleDateString('nl-NL')}</p>
                    <p className="text-gray-600">Vervaldatum: {new Date(formData.due_date).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold mb-2">Uw Salon</h2>
                    <p className="text-gray-600">Adresgegevens</p>
                    <p className="text-gray-600">Postcode Plaats</p>
                    <p className="text-gray-600">BTW: NL123456789B01</p>
                  </div>
                </div>

                {/* Client Info */}
                {selectedClient && (
                  <div className="mb-8">
                    <h3 className="font-semibold mb-2">Factuuradres:</h3>
                    <p>{selectedClient.first_name} {selectedClient.last_name}</p>
                    <p className="text-gray-600">{selectedClient.address || 'Geen adres opgegeven'}</p>
                    <p className="text-gray-600">{selectedClient.email}</p>
                  </div>
                )}

                {/* Invoice Items */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Omschrijving</th>
                      <th className="text-center py-2">Aantal</th>
                      <th className="text-right py-2">Prijs</th>
                      <th className="text-right py-2">BTW</th>
                      <th className="text-right py-2">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.filter(item => item.description).map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.description}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">€{item.price.toFixed(2)}</td>
                        <td className="text-right py-2">{item.vat_rate}%</td>
                        <td className="text-right py-2">€{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right py-2">Subtotaal:</td>
                      <td className="text-right py-2">€{subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2">BTW:</td>
                      <td className="text-right py-2">€{vatAmount.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold text-lg">
                      <td colSpan={4} className="text-right py-2">Totaal:</td>
                      <td className="text-right py-2">€{total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Payment Info */}
                <div className="mb-8">
                  <p className="font-semibold mb-2">Betalingsinformatie:</p>
                  <p className="text-gray-600">Betalingstermijn: {formData.payment_terms}</p>
                  <p className="text-gray-600">
                    Betaalmethode: {
                      paymentMethod === 'bank_transfer' ? 'Bank Overschrijving' :
                      paymentMethod === 'cash' ? 'Contant' :
                      paymentMethod === 'card' ? 'Pin/Creditcard' : 'Overig'
                    }
                  </p>
                </div>

                {/* Notes */}
                {formData.notes && (
                  <div className="mb-8">
                    <p className="font-semibold mb-2">Opmerkingen:</p>
                    <p className="text-gray-600">{formData.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">{formData.footer_text}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="btn-secondary"
              >
                Sluiten
              </button>
              <button
                onClick={() => {
                  // TODO: Implement PDF generation with a different library
                  console.log('PDF generation coming soon');
                }}
                className="btn-primary"
                disabled
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}