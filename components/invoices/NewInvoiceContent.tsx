'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/hooks/useTenant';
import { useClients } from '@/lib/hooks/useClients';
import { InvoiceService } from '@/lib/services/invoiceService';
import { CreateInvoiceData } from '@/types/invoice';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Euro,
  User,
  FileText,
  Loader2,
  Search,
  X
} from 'lucide-react';

interface InvoiceItem {
  service_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export function NewInvoiceContent() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  
  // Form state
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(21);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const filteredClients = (clients || []).filter(client => 
    `${client.first_name} ${client.last_name} ${client.email}`.toLowerCase()
      .includes(clientSearch.toLowerCase())
  );

  useEffect(() => {
    if (tenantId) {
      fetchServices();
    }
  }, [tenantId]);

  const fetchServices = async () => {
    if (!tenantId) return;
    
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
    
    setServices(data || []);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price when service is selected
    if (field === 'service_id' && value) {
      const service = services.find(s => s.id === value);
      if (service) {
        newItems[index].description = service.name;
        newItems[index].unit_price = service.price;
      }
    }
    
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal - discountAmount) * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal - discountAmount + tax;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      alert('Geen tenant gevonden. Probeer opnieuw in te loggen.');
      return;
    }
    
    if (!selectedClient) {
      alert('Selecteer eerst een klant.');
      return;
    }
    
    const validItems = items.filter(item => item.description && item.unit_price > 0);
    if (validItems.length === 0) {
      alert('Voeg minimaal één geldig item toe (met beschrijving en prijs).');
      return;
    }
    
    setLoading(true);
    
    try {
      const invoiceData: CreateInvoiceData = {
        tenant_id: tenantId,
        client_id: selectedClient,
        due_date: dueDate,
        notes,
        items: validItems,
        discount_amount: discountAmount,
        tax_rate: taxRate
      };
      
      const invoice = await InvoiceService.createInvoice(invoiceData);
      
      // Invalidate invoices cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Redirect to invoices overview
      router.push('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(`Er is een fout opgetreden bij het maken van de factuur: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/invoices')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#010009] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Terug naar overzicht</span>
        </button>

        <h1 className="text-3xl font-medium text-[#010009]" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
          Nieuwe factuur
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-[#010009] mb-4">Klantgegevens</h2>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecteer klant
            </label>
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Zoek op naam of email..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClient(client.id);
                        setClientSearch(`${client.first_name} ${client.last_name} - ${client.email}`);
                        setShowClientDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium">{client.first_name} {client.last_name}</p>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-[#010009] mb-4">Factuurgegevens</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vervaldatum
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BTW %
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Korting €
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opmerkingen (optioneel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
              placeholder="Eventuele opmerkingen voor de klant..."
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[#010009]">Factuurregels</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1.5 bg-[#02011F] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Regel toevoegen
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Omschrijving"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    required
                  />
                  {services.length > 0 && (
                    <select
                      value={item.service_id || ''}
                      onChange={(e) => updateItem(index, 'service_id', e.target.value)}
                      className="w-full mt-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    >
                      <option value="">Kies een service...</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - €{service.price}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    placeholder="Aantal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="Prijs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="col-span-2 text-right pt-2">
                  <span className="font-medium">€ {(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
                
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotaal</span>
                <span>€ {calculateSubtotal().toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Korting</span>
                  <span>- € {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>BTW ({taxRate}%)</span>
                <span>€ {calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-medium pt-2 border-t">
                <span>Totaal</span>
                <span>€ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>Loading: {loading ? 'true' : 'false'}</p>
              <p>Clients Loading: {clientsLoading ? 'true' : 'false'}</p>
              <p>Clients Count: {clients?.length || 0}</p>
              <p>Filtered Clients: {filteredClients.length}</p>
              <p>Selected Client: {selectedClient || 'GEEN'}</p>
              <p>Items Count: {items.length}</p>
              <p>Valid Items: {items.filter(item => item.description && item.unit_price > 0).length}</p>
              <p>Button Disabled: {(loading || !selectedClient || items.filter(item => item.description && item.unit_price > 0).length === 0) ? 'true' : 'false'}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/invoices')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading || !selectedClient || items.filter(item => item.description && item.unit_price > 0).length === 0}
            className="flex-1 px-6 py-3 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Aanmaken...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Factuur aanmaken
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}