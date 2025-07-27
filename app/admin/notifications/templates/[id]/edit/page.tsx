'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { 
  Mail, 
  Save,
  ArrowLeft,
  Loader2,
  Eye,
  Code,
  Type,
  AlertCircle,
  Tag,
  Send,
  CheckCircle
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: { [key: string]: string };
  active: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'appointment_confirmation', label: 'Afspraak Bevestiging' },
  { value: 'appointment_reminder', label: 'Afspraak Herinnering' },
  { value: 'invoice', label: 'Factuur' },
  { value: 'welcome', label: 'Welkomstbericht' },
  { value: 'birthday', label: 'Verjaardag' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'custom', label: 'Aangepast' }
];

const AVAILABLE_VARIABLES = {
  appointment_confirmation: [
    { key: '{{client_name}}', desc: 'Naam van de klant' },
    { key: '{{salon_name}}', desc: 'Naam van de salon' },
    { key: '{{appointment_date}}', desc: 'Datum van de afspraak' },
    { key: '{{appointment_time}}', desc: 'Tijd van de afspraak' },
    { key: '{{service_name}}', desc: 'Naam van de behandeling' },
    { key: '{{staff_name}}', desc: 'Naam van de medewerker' },
    { key: '{{duration}}', desc: 'Duur van de behandeling' },
    { key: '{{price}}', desc: 'Prijs van de behandeling' }
  ],
  appointment_reminder: [
    { key: '{{client_name}}', desc: 'Naam van de klant' },
    { key: '{{salon_name}}', desc: 'Naam van de salon' },
    { key: '{{appointment_date}}', desc: 'Datum van de afspraak' },
    { key: '{{appointment_time}}', desc: 'Tijd van de afspraak' },
    { key: '{{service_name}}', desc: 'Naam van de behandeling' },
    { key: '{{staff_name}}', desc: 'Naam van de medewerker' }
  ],
  invoice: [
    { key: '{{client_name}}', desc: 'Naam van de klant' },
    { key: '{{invoice_number}}', desc: 'Factuurnummer' },
    { key: '{{invoice_date}}', desc: 'Factuurdatum' },
    { key: '{{due_date}}', desc: 'Vervaldatum' },
    { key: '{{total_amount}}', desc: 'Totaalbedrag' },
    { key: '{{invoice_link}}', desc: 'Link naar factuur' }
  ]
};

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const { isAdmin, isLoading } = useRequireAdmin();
  const router = useRouter();
  
  const [template, setTemplate] = useState<EmailTemplate>({
    id: params.id,
    name: '',
    type: 'appointment_confirmation',
    subject: '',
    body_html: '',
    body_text: '',
    variables: {},
    active: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview'>('html');
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setTemplate({
        id: params.id,
        name: 'Afspraak Bevestiging',
        type: 'appointment_confirmation',
        subject: 'Bevestiging van uw afspraak bij {{salon_name}}',
        body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Beste {{client_name}},</h2>
  
  <p>Bedankt voor het maken van een afspraak bij {{salon_name}}. Hierbij bevestigen wij uw afspraak:</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Datum:</strong> {{appointment_date}}</p>
    <p style="margin: 5px 0;"><strong>Tijd:</strong> {{appointment_time}}</p>
    <p style="margin: 5px 0;"><strong>Behandeling:</strong> {{service_name}}</p>
    <p style="margin: 5px 0;"><strong>Medewerker:</strong> {{staff_name}}</p>
    <p style="margin: 5px 0;"><strong>Duur:</strong> {{duration}}</p>
    <p style="margin: 5px 0;"><strong>Prijs:</strong> €{{price}}</p>
  </div>
  
  <p>Mocht u verhinderd zijn, laat het ons dan zo snel mogelijk weten.</p>
  
  <p>We kijken ernaar uit u te zien!</p>
  
  <p>Met vriendelijke groet,<br>
  Het team van {{salon_name}}</p>
</div>`,
        body_text: `Beste {{client_name}},

Bedankt voor het maken van een afspraak bij {{salon_name}}. Hierbij bevestigen wij uw afspraak:

Datum: {{appointment_date}}
Tijd: {{appointment_time}}
Behandeling: {{service_name}}
Medewerker: {{staff_name}}
Duur: {{duration}}
Prijs: €{{price}}

Mocht u verhinderd zijn, laat het ons dan zo snel mogelijk weten.

We kijken ernaar uit u te zien!

Met vriendelijke groet,
Het team van {{salon_name}}`,
        variables: {},
        active: true
      });
    } catch (err) {
      setError('Kon template niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EmailTemplate, value: any) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const insertVariable = (variable: string) => {
    if (activeTab === 'html') {
      const textarea = document.getElementById('body_html') as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = template.body_html;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      handleInputChange('body_html', before + variable + after);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else if (activeTab === 'text') {
      const textarea = document.getElementById('body_text') as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = template.body_text;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      handleInputChange('body_text', before + variable + after);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // TODO: Implement actual save logic
      console.log('Saving template:', template);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Template succesvol opgeslagen');
    } catch (err) {
      setError('Er is een fout opgetreden bij het opslaan van de template');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setError('Voer een e-mailadres in voor de test');
      return;
    }

    setError(null);
    setSuccess(null);
    setSendingTest(true);

    try {
      // TODO: Implement test email sending
      console.log('Sending test email to:', testEmail);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Test e-mail verstuurd naar ${testEmail}`);
      setTestEmail('');
    } catch (err) {
      setError('Kon test e-mail niet versturen');
    } finally {
      setSendingTest(false);
    }
  };

  const getPreviewHtml = () => {
    let html = template.body_html;
    const variables = AVAILABLE_VARIABLES[template.type as keyof typeof AVAILABLE_VARIABLES] || [];
    
    // Replace variables with sample data
    variables.forEach(({ key }) => {
      const sampleValues: { [key: string]: string } = {
        '{{client_name}}': 'Jan Jansen',
        '{{salon_name}}': 'Beauty Salon',
        '{{appointment_date}}': '15 juni 2025',
        '{{appointment_time}}': '14:00',
        '{{service_name}}': 'Knippen & Föhnen',
        '{{staff_name}}': 'Emma de Vries',
        '{{duration}}': '60 minuten',
        '{{price}}': '45,00',
        '{{invoice_number}}': 'INV-2025-0001',
        '{{invoice_date}}': '15 juni 2025',
        '{{due_date}}': '15 juli 2025',
        '{{total_amount}}': '145,00',
        '{{invoice_link}}': '#'
      };
      html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), sampleValues[key] || key);
    });
    
    return html;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const availableVars = AVAILABLE_VARIABLES[template.type as keyof typeof AVAILABLE_VARIABLES] || [];

  return (
    <div className="mobile-p max-w-6xl">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/notifications')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar e-mail templates
        </button>
        
        <h1 className="text-3xl font-bold tracking-tight">E-mail Template Bewerken</h1>
        <p className="text-gray-600 mt-2">
          Pas de inhoud en instellingen van deze e-mail template aan
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-5 w-5 mt-0.5" />
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Settings */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5" />
              <h2 className="text-heading">Template Instellingen</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Naam *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={template.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onderwerp *
                </label>
                <input
                  type="text"
                  value={template.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Gebruik {{variabelen}} voor dynamische content"
                  required
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={template.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Template is actief
                </label>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading">Inhoud</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('html')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    activeTab === 'html' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Code className="h-4 w-4 inline mr-1" />
                  HTML
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    activeTab === 'text' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Type className="h-4 w-4 inline mr-1" />
                  Tekst
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    activeTab === 'preview' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  Voorbeeld
                </button>
              </div>
            </div>
            
            {activeTab === 'html' && (
              <textarea
                id="body_html"
                value={template.body_html}
                onChange={(e) => handleInputChange('body_html', e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="HTML inhoud van de e-mail..."
              />
            )}
            
            {activeTab === 'text' && (
              <textarea
                id="body_text"
                value={template.body_text}
                onChange={(e) => handleInputChange('body_text', e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Platte tekst versie van de e-mail..."
              />
            )}
            
            {activeTab === 'preview' && (
              <div className="border border-gray-200 rounded-xl p-4 min-h-[400px] bg-white">
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Available Variables */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5" />
              <h3 className="font-medium">Beschikbare Variabelen</h3>
            </div>
            
            <div className="space-y-2">
              {availableVars.map(({ key, desc }) => (
                <button
                  key={key}
                  onClick={() => insertVariable(key)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded-lg group"
                  disabled={activeTab === 'preview'}
                >
                  <code className="text-xs text-primary-600 font-mono">{key}</code>
                  <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            
            {availableVars.length === 0 && (
              <p className="text-sm text-gray-500">
                Selecteer eerst een template type om beschikbare variabelen te zien
              </p>
            )}
          </div>

          {/* Test Email */}
          <div className="card">
            <h3 className="font-medium mb-4">Test E-mail Versturen</h3>
            
            <div className="space-y-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@voorbeeld.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              
              <button
                onClick={handleSendTest}
                disabled={sendingTest || !testEmail}
                className="w-full btn-secondary"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Versturen...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Test Versturen
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !template.name || !template.subject}
            className="w-full btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Template Opslaan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}