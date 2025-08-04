'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { 
  CreditCard, 
  Check,
  Star,
  Calendar,
  ArrowUpCircle,
  Download,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SubscriptionData {
  isActive: boolean;
  planName: string;
  price: number;
  nextBillingDate: string;
  paymentMethod?: {
    last4: string;
    brand: string;
  };
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
}

export default function SubscriptionPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Simulate API call to fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!tenantId) return;
      
      setLoadingSubscription(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock subscription data - in real implementation this would come from Mollie/Stripe
      const mockSubscription: SubscriptionData = {
        isActive: true,
        planName: 'SalonSphere Pro',
        price: 79,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: {
          last4: '4242',
          brand: 'Visa'
        },
        status: 'active'
      };
      
      setSubscription(mockSubscription);
      setLoadingSubscription(false);
    };

    fetchSubscriptionData();
  }, [tenantId]);

  const handleUpgrade = async () => {
    // TODO: Integrate with Mollie API for subscription creation
    console.log('Redirecting to Mollie payment...');
    alert('Mollie integratie wordt binnenkort toegevoegd. U wordt doorgestuurd naar het betaalportaal.');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Weet u zeker dat u uw abonnement wilt opzeggen? U verliest toegang tot alle premium functies.')) {
      return;
    }
    
    // TODO: Integrate with Mollie API for subscription cancellation
    console.log('Cancelling subscription...');
    alert('Uw abonnement wordt opgezegd. U behoudt toegang tot het einde van de huidige facturatieperiode.');
  };

  const handleUpdatePaymentMethod = async () => {
    // TODO: Integrate with Mollie API for payment method update
    console.log('Updating payment method...');
    alert('U wordt doorgestuurd naar het betaalportaal om uw betalingsmethode bij te werken.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 status-chip bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Actief
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 status-chip bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Opgezegd
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 status-chip bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3" />
            Achterstallig
          </span>
        );
      default:
        return (
          <span className="status-chip bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (isLoading || loadingSubscription) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const planFeatures = [
    'Onbeperkt aantal afspraken',
    'Onbeperkt aantal medewerkers',
    'Geavanceerde rapportage en analytics',
    'SMS en email herinneringen',
    'Online boekingssysteem voor klanten',
    'Voorraad- en factuurbebeher',
    'Multi-tenant ondersteuning',
    'Prioriteit klantenservice',
    'Automatische backups',
    'SSL beveiliging en encryptie'
  ];

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-gray-600 mt-2">
          Beheer uw SalonSphere Pro abonnement
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription ? (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-heading">Huidig Abonnement</h2>
          </div>
          
          <div className="flex items-start justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-green-900">{subscription.planName}</h3>
                {getStatusBadge(subscription.status)}
              </div>
              <p className="text-green-700 mb-1">€{subscription.price}/maand</p>
              <p className="text-sm text-green-600">
                Volgende facturatie: {new Date(subscription.nextBillingDate).toLocaleDateString('nl-NL')}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => alert('Facturen downloaden wordt binnenkort beschikbaar.')}
                className="btn-outlined text-sm"
              >
                <Download className="h-4 w-4" />
                Facturen
              </button>
              {subscription.status === 'active' && (
                <button 
                  onClick={handleCancelSubscription}
                  className="btn-outlined text-sm text-red-600 border-red-200 hover:bg-red-50"
                >
                  Opzeggen
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* No Active Subscription */
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h2 className="text-heading">Geen Actief Abonnement</h2>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-yellow-800 mb-3">
              U heeft momenteel geen actief abonnement. Upgrade naar SalonSphere Pro om toegang te krijgen tot alle functies.
            </p>
            <button 
              onClick={handleUpgrade}
              className="btn-primary"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Start Abonnement
            </button>
          </div>
        </div>
      )}

      {/* SalonSphere Pro Plan */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5" />
          <h2 className="text-heading">SalonSphere Pro</h2>
        </div>
        
        <div className="border border-primary-200 bg-primary-50 rounded-xl p-6 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Aanbevolen
            </span>
          </div>

          <h3 className="text-xl font-bold mb-2">Complete salon management oplossing</h3>
          <p className="text-gray-600 text-sm mb-4">
            Alles wat u nodig heeft om uw salon efficiënt te beheren
          </p>
          
          <div className="mb-6">
            <span className="text-4xl font-bold text-primary-600">€79</span>
            <span className="text-gray-600">/maand</span>
            <p className="text-sm text-gray-500 mt-1">
              Inclusief BTW • Altijd opzegbaar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {planFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {!subscription ? (
            <button 
              onClick={handleUpgrade}
              className="w-full btn-primary text-lg py-3"
            >
              <ArrowUpCircle className="h-5 w-5" />
              Start Nu - €79/maand
            </button>
          ) : subscription.status !== 'active' ? (
            <button 
              onClick={handleUpgrade}
              className="w-full btn-primary text-lg py-3"
            >
              <ArrowUpCircle className="h-5 w-5" />
              Heractiveer Abonnement
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-500 text-center py-3 rounded-xl font-medium">
              Huidig Actief Plan
            </div>
          )}
        </div>
      </div>

      {/* Payment & Billing Information */}
      {subscription && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            <h2 className="text-heading">Facturatie & Betaling</h2>
          </div>
          
          <div className="space-y-4">
            {subscription.paymentMethod && (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <p className="font-medium">Betalingsmethode</p>
                  <p className="text-sm text-gray-600">
                    **** **** **** {subscription.paymentMethod.last4} ({subscription.paymentMethod.brand})
                  </p>
                </div>
                <button 
                  onClick={handleUpdatePaymentMethod}
                  className="btn-outlined text-sm"
                >
                  Wijzigen
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <p className="font-medium">Facturatie Cyclus</p>
                <p className="text-sm text-gray-600">
                  Maandelijks - Volgende betaling op {new Date(subscription.nextBillingDate).toLocaleDateString('nl-NL')}
                </p>
              </div>
              <span className="text-sm text-gray-500">€{subscription.price}/maand</span>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex gap-2">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Veilig en Betrouwbaar</p>
                  <p>
                    Alle betalingen worden veilig verwerkt via Mollie. 
                    Uw abonnement verlengt automatisch, maar u kunt altijd opzeggen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}