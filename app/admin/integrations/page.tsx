'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useGoogleCalendarIntegration, useDisconnectGoogleCalendar, useTestGoogleCalendarConnection } from '@/lib/hooks/useGoogleCalendar';
import { 
  Plug, 
  CreditCard,
  Calendar,
  CheckCircle,
  Settings,
  ExternalLink,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';

export default function IntegrationsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Google Calendar hooks
  const { data: googleCalendarIntegration, isLoading: gcLoading } = useGoogleCalendarIntegration();
  const disconnectGoogleCalendar = useDisconnectGoogleCalendar();
  const testConnection = useTestGoogleCalendarConnection();

  // Handle URL parameters for OAuth callback feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'google_calendar_connected') {
      setFeedback({
        type: 'success',
        message: 'Google Calendar succesvol verbonden! Uw afspraken worden nu gesynchroniseerd.'
      });
      // Clean URL
      window.history.replaceState({}, '', '/admin/integrations');
      setTimeout(() => setFeedback(null), 5000);
    } else if (error) {
      let errorMessage = 'Er is een fout opgetreden bij het verbinden van Google Calendar.';
      switch (error) {
        case 'access_denied':
          errorMessage = 'Toegang geweigerd. Probeer opnieuw en geef toestemming voor kalendertoegang.';
          break;
        case 'unauthorized':
          errorMessage = 'Niet geautoriseerd. Log opnieuw in en probeer het nogmaals.';
          break;
        case 'invalid_tenant':
          errorMessage = 'Ongeldige tenant. Contacteer support als dit probleem aanhoudt.';
          break;
      }
      setFeedback({ type: 'error', message: errorMessage });
      // Clean URL
      window.history.replaceState({}, '', '/admin/integrations');
      setTimeout(() => setFeedback(null), 5000);
    }
  }, []);

  if (isLoading || gcLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const integrations = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Synchroniseer afspraken automatisch met uw Google Agenda',
      category: 'Planning',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      connected: googleCalendarIntegration?.is_connected || false,
      popular: true,
      status: 'available'
    },
    {
      id: 'mollie',
      name: 'Mollie',
      description: 'Online betalingen voor abonnementen en facturen',
      category: 'Betalingen',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      connected: false,
      popular: true,
      status: 'coming_soon'
    }
  ];

  const categories = [...new Set(integrations.map(i => i.category))];

  const handleConnectIntegration = async (integrationId: string) => {
    if (integrationId === 'google-calendar') {
      try {
        setIsConnecting(true);
        const response = await fetch('/api/auth/google');
        const data = await response.json();
        
        if (response.ok && data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        } else {
          throw new Error(data.error || 'Failed to get authorization URL');
        }
      } catch (error) {
        setFeedback({ 
          type: 'error', 
          message: 'Fout bij verbinden met Google Calendar. Probeer het opnieuw.' 
        });
        setTimeout(() => setFeedback(null), 4000);
        setIsConnecting(false);
      }
    } else if (integrationId === 'mollie') {
      setFeedback({ 
        type: 'error', 
        message: 'Mollie integratie is in ontwikkeling en wordt binnenkort beschikbaar.' 
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    if (integrationId === 'google-calendar') {
      try {
        await disconnectGoogleCalendar.mutateAsync();
        setFeedback({ 
          type: 'success', 
          message: 'Google Calendar integratie is succesvol losgekoppeld.' 
        });
        setTimeout(() => setFeedback(null), 3000);
      } catch (error) {
        setFeedback({ 
          type: 'error', 
          message: 'Fout bij loskoppelen van Google Calendar. Probeer het opnieuw.' 
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    if (integrationId === 'google-calendar') {
      try {
        const result = await testConnection.mutateAsync();
        setFeedback({ 
          type: result.connected ? 'success' : 'error', 
          message: result.connected 
            ? 'Google Calendar verbinding werkt correct!' 
            : 'Google Calendar verbinding is niet beschikbaar. Probeer opnieuw te verbinden.'
        });
        setTimeout(() => setFeedback(null), 4000);
      } catch (error) {
        setFeedback({ 
          type: 'error', 
          message: 'Fout bij testen van verbinding. Probeer het opnieuw.' 
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    }
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
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Connected Integrations */}
      {integrations.some(i => i.connected) && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-heading">Actieve Integraties</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleTestConnection(integration.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                      disabled={testConnection.isPending}
                    >
                      {testConnection.isPending ? 'Testen...' : 'Test'}
                    </button>
                    <button 
                      onClick={() => handleDisconnectIntegration(integration.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                      disabled={disconnectGoogleCalendar.isPending}
                    >
                      {disconnectGoogleCalendar.isPending ? 'Bezig...' : 'Loskoppelen'}
                    </button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Plug className="h-5 w-5" />
          <h2 className="text-heading">Beschikbare Integraties</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {integrations
            .filter(i => !i.connected)
            .map((integration) => (
              <div key={integration.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${integration.bgColor}`}>
                    <div className={integration.color}>{integration.icon}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.status === 'coming_soon' && (
                      <span className="status-chip bg-orange-100 text-orange-800">Binnenkort</span>
                    )}
                    {integration.popular && integration.status !== 'coming_soon' && (
                      <span className="status-chip bg-blue-100 text-blue-800">Populair</span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="status-chip bg-gray-100 text-gray-600">{integration.category}</span>
                  <div className="flex gap-2">
                    {integration.status === 'available' && (
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleConnectIntegration(integration.id)}
                      className={`btn-outlined text-sm ${
                        integration.status === 'coming_soon' || (integration.id === 'google-calendar' && isConnecting)
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                      disabled={integration.status === 'coming_soon' || (integration.id === 'google-calendar' && isConnecting)}
                    >
                      {integration.status === 'coming_soon' 
                        ? 'Binnenkort' 
                        : integration.id === 'google-calendar' && isConnecting
                        ? 'Verbinden...'
                        : 'Verbinden'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Integration Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-heading">Integratie Informatie</h2>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex gap-2">
              <Calendar className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Google Calendar</p>
                <p>Synchroniseer automatisch uw afspraken met Google Calendar. Klanten kunnen uw beschikbaarheid zien en afspraken worden automatisch toegevoegd aan uw agenda.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-2">
              <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Mollie Betalingen</p>
                <p>Accepteer online betalingen voor abonnementen en facturen via iDEAL, creditcard en andere populaire betaalmethoden. Binnenkort beschikbaar.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex gap-2">
              <Settings className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-800">
                <p className="font-medium mb-1">Veilige Verbindingen</p>
                <p>Alle integraties gebruiken OAuth 2.0 authenticatie en veilige HTTPS verbindingen. Uw gegevens blijven altijd privé en veilig.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}