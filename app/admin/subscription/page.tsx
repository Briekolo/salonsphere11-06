'use client';

import { useState } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { 
  CreditCard, 
  TrendingUp,
  Check,
  Star,
  Calendar,
  Users,
  Database,
  Shield,
  ArrowUpCircle,
  Download,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function SubscriptionPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [currentPlan] = useState({
    name: 'Professional',
    price: 49,
    billingCycle: 'monthly',
    nextBillingDate: '2024-07-15',
    features: ['Unlimited appointments', 'Up to 10 staff members', 'Advanced reporting', 'Email support'],
    usage: {
      appointments: { current: 1250, limit: 'unlimited' },
      staff: { current: 3, limit: 10 },
      storage: { current: 2.1, limit: 50 } // GB
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const plans = [
    {
      name: 'Starter',
      price: 19,
      billingCycle: 'monthly',
      yearlyPrice: 190,
      description: 'Perfect voor kleine salons',
      features: [
        'Tot 100 afspraken per maand',
        'Tot 3 personeelsleden',
        'Basis rapportage',
        'Email ondersteuning',
        '5GB opslag'
      ],
      limits: {
        appointments: 100,
        staff: 3,
        storage: 5
      },
      popular: false
    },
    {
      name: 'Professional',
      price: 49,
      billingCycle: 'monthly',
      yearlyPrice: 490,
      description: 'Ideaal voor groeiende salons',
      features: [
        'Onbeperkt aantal afspraken',
        'Tot 10 personeelsleden',
        'Geavanceerde rapportage',
        'Prioriteit ondersteuning',
        '50GB opslag',
        'SMS herinneringen',
        'Online boeken'
      ],
      limits: {
        appointments: 'unlimited',
        staff: 10,
        storage: 50
      },
      popular: true
    },
    {
      name: 'Enterprise',
      price: 99,
      billingCycle: 'monthly',
      yearlyPrice: 990,
      description: 'Voor grote salon ketens',
      features: [
        'Onbeperkt aantal afspraken',
        'Onbeperkt personeelsleden',
        'Custom rapportage',
        'Telefonische ondersteuning',
        '200GB opslag',
        'Multi-locatie beheer',
        'API toegang',
        'White-label opties'
      ],
      limits: {
        appointments: 'unlimited',
        staff: 'unlimited',
        storage: 200
      },
      popular: false
    }
  ];

  const getCurrentPlanIndex = () => {
    return plans.findIndex(plan => plan.name === currentPlan.name);
  };

  const formatUsage = (current: number | string, limit: number | string, unit: string = '') => {
    if (limit === 'unlimited') {
      return `${current}${unit} (onbeperkt)`;
    }
    return `${current}${unit} van ${limit}${unit}`;
  };

  const getUsagePercentage = (current: number, limit: number | string) => {
    if (limit === 'unlimited') return 0;
    return (current / (limit as number)) * 100;
  };

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-gray-600 mt-2">
          Beheer uw SalonSphere abonnement
        </p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5" />
          <h2 className="text-heading">Huidig Abonnement</h2>
        </div>
        
        <div className="flex items-start justify-between p-4 bg-green-50 rounded-xl border border-green-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-green-900">{currentPlan.name}</h3>
              <span className="status-chip bg-green-100 text-green-800">Actief</span>
            </div>
            <p className="text-green-700 mb-1">€{currentPlan.price}/maand</p>
            <p className="text-sm text-green-600">
              Volgende facturatie: {new Date(currentPlan.nextBillingDate).toLocaleDateString('nl-NL')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-outlined text-sm">
              <Download className="h-4 w-4" />
              Facturen
            </button>
            <button className="btn-primary text-sm">
              <ArrowUpCircle className="h-4 w-4" />
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h2 className="text-heading">Gebruik Overzicht</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-icon-blue" />
              <h3 className="font-medium">Afspraken</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentPlan.usage.appointments.current}</p>
            <p className="text-sm text-gray-600">
              {formatUsage(currentPlan.usage.appointments.current, currentPlan.usage.appointments.limit)}
            </p>
            {currentPlan.usage.appointments.limit !== 'unlimited' && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-icon-blue h-2 rounded-full" 
                  style={{ 
                    width: `${getUsagePercentage(currentPlan.usage.appointments.current, currentPlan.usage.appointments.limit)}%` 
                  }}
                ></div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-icon-green" />
              <h3 className="font-medium">Personeel</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentPlan.usage.staff.current}</p>
            <p className="text-sm text-gray-600">
              {formatUsage(currentPlan.usage.staff.current, currentPlan.usage.staff.limit)}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-icon-green h-2 rounded-full" 
                style={{ 
                  width: `${getUsagePercentage(currentPlan.usage.staff.current, currentPlan.usage.staff.limit)}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-icon-purple" />
              <h3 className="font-medium">Opslag</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentPlan.usage.storage.current}GB</p>
            <p className="text-sm text-gray-600">
              {formatUsage(currentPlan.usage.storage.current, currentPlan.usage.storage.limit, 'GB')}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-icon-purple h-2 rounded-full" 
                style={{ 
                  width: `${getUsagePercentage(currentPlan.usage.storage.current, currentPlan.usage.storage.limit)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5" />
          <h2 className="text-heading">Beschikbare Plannen</h2>
        </div>
        
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={plan.name} 
              className={`border rounded-xl p-6 relative ${
                plan.name === currentPlan.name 
                  ? 'border-primary-500 bg-primary-50' 
                  : plan.popular 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200'
              }`}
            >
              {plan.popular && plan.name !== currentPlan.name && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Populair
                  </span>
                </div>
              )}
              
              {plan.name === currentPlan.name && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Huidig Plan
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <span className="text-3xl font-bold">€{plan.price}</span>
                <span className="text-gray-600">/maand</span>
                <p className="text-sm text-gray-500 mt-1">
                  Of €{plan.yearlyPrice}/jaar (2 maanden gratis)
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-2 px-4 rounded-xl font-medium transition-colors ${
                  plan.name === currentPlan.name
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : index > getCurrentPlanIndex()
                      ? 'btn-primary'
                      : 'btn-outlined'
                }`}
                disabled={plan.name === currentPlan.name}
              >
                {plan.name === currentPlan.name 
                  ? 'Huidig Plan'
                  : index > getCurrentPlanIndex()
                    ? 'Upgrade'
                    : 'Downgrade'
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h2 className="text-heading">Facturatie Informatie</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Betalingsmethode</p>
              <p className="text-sm text-gray-600">**** **** **** 4242 (Visa)</p>
            </div>
            <button className="btn-outlined text-sm">
              Wijzigen
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Facturatie Cyclus</p>
              <p className="text-sm text-gray-600">Maandelijks - Volgende betaling op {new Date(currentPlan.nextBillingDate).toLocaleDateString('nl-NL')}</p>
            </div>
            <button className="btn-outlined text-sm">
              Naar Jaarlijks
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Jaarlijkse Besparing</p>
                <p>Schakel over naar jaarlijkse facturatie en bespaar 2 maanden per jaar. Dat is een besparing van €98 voor uw huidige plan!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}