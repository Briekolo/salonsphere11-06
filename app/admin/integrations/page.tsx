'use client';

import { useState } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { 
  Plug, 
  CreditCard,
  Mail,
  Calendar,
  MessageSquare,
  BarChart3,
  CheckCircle,
  Settings,
  ExternalLink,
  AlertTriangle,
  Plus
} from 'lucide-react';

export default function IntegrationsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [activeIntegrations, setActiveIntegrations] = useState(['stripe', 'google-calendar']);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const integrations = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Online betalingen verwerken via creditcard en iDEAL',
      category: 'Betalingen',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      connected: true,
      popular: true
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Synchroniseer afspraken met uw Google Agenda',
      category: 'Planning',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      connected: true,
      popular: true
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing en nieuwsbrieven versturen',
      category: 'Marketing',
      icon: <Mail className="h-6 w-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      connected: false,
      popular: true
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS herinneringen en notificaties versturen',
      category: 'Communicatie',
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      connected: false,
      popular: false
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Website analytics en klantengedrag tracken',
      category: 'Analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      connected: false,
      popular: false
    },
    {
      id: 'facebook-pixel',
      name: 'Facebook Pixel',
      description: 'Track conversies voor Facebook advertenties',
      category: 'Marketing',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'text-blue-800',
      bgColor: 'bg-blue-50',
      connected: false,
      popular: false
    }
  ];

  const categories = [...new Set(integrations.map(i => i.category))];

  const handleToggleIntegration = (integrationId: string) => {
    setActiveIntegrations(prev => 
      prev.includes(integrationId) 
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integraties</h1>
          <p className="text-gray-600 mt-2">
            Verbind externe diensten met uw salon
          </p>
        </div>
        <button className="btn-outlined">
          <Plus className="h-4 w-4" />
          Aangepaste Integratie
        </button>
      </div>

      {/* Connected Integrations */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-heading">Actieve Integraties</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.filter(i => i.connected).map((integration) => (
            <div key={integration.id} className="border border-green-200 bg-green-50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${integration.bgColor}`}>
                  <div className={integration.color}>{integration.icon}</div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Verbonden</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{integration.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="status-chip bg-gray-100 text-gray-600">{integration.category}</span>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Integrations by Category */}
      {categories.map((category) => (
        <div key={category} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Plug className="h-5 w-5" />
            <h2 className="text-heading">{category}</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations
              .filter(i => i.category === category && !i.connected)
              .map((integration) => (
                <div key={integration.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl ${integration.bgColor}`}>
                      <div className={integration.color}>{integration.icon}</div>
                    </div>
                    {integration.popular && (
                      <span className="status-chip bg-icon-blue-bg text-icon-blue">Populair</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="status-chip bg-gray-100 text-gray-600">{integration.category}</span>
                    <div className="flex gap-2">
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleIntegration(integration.id)}
                        className="btn-outlined text-sm"
                      >
                        Verbinden
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Integration Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-heading">Integratie Informatie</h2>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">API Sleutels Vereist</p>
                <p>Voor de meeste integraties heeft u API sleutels of toegangstokens nodig van de externe service. Deze worden veilig opgeslagen en versleuteld.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Veilige Verbindingen</p>
                <p>Alle integraties gebruiken veilige HTTPS verbindingen en worden regelmatig gecontroleerd op beveiligingslekken.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Kosten</p>
                <p>Sommige integraties kunnen extra kosten met zich meebrengen bij de externe service provider. Controleer hun prijzen voordat u verbinding maakt.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}