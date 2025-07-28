'use client';

import { useState } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { 
  Building2, 
  Clock, 
  Bell, 
  Calendar, 
  CreditCard, 
  Calculator,
  Shield, 
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { BusinessInfoTab } from './BusinessInfoTab';
import { OpeningHoursTab } from './OpeningHoursTab';
import { NotificationPreferencesTab } from './NotificationPreferencesTab';
import { BookingRulesTab } from './BookingRulesTab';
import { PaymentMethodsTab } from './PaymentMethodsTab';
import { TaxSettingsTab } from './TaxSettingsTab';

type TabId = 'business' | 'hours' | 'notifications' | 'booking' | 'payment' | 'tax';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const tabs: Tab[] = [
  {
    id: 'business',
    label: 'Bedrijfsinfo',
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: 'hours',
    label: 'Openingstijden',
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: 'notifications',
    label: 'Meldingen',
    icon: <Bell className="h-4 w-4" />
  },
  {
    id: 'booking',
    label: 'Boekingsregels',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    id: 'payment',
    label: 'Betaalmethodes',
    icon: <CreditCard className="h-4 w-4" />
  },
  {
    id: 'tax',
    label: 'BTW Instellingen',
    icon: <Calculator className="h-4 w-4" />,
    adminOnly: true
  }
];

export function SettingsContent() {
  const { isAdmin } = useIsAdmin();
  const [activeTab, setActiveTab] = useState<TabId>('business');

  const availableTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessInfoTab />;
      case 'hours':
        return <OpeningHoursTab />;
      case 'notifications':
        return <NotificationPreferencesTab />;
      case 'booking':
        return <BookingRulesTab />;
      case 'payment':
        return <PaymentMethodsTab />;
      case 'tax':
        return <TaxSettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Beheer uw salon instellingen en voorkeuren
        </p>
      </div>

      {isAdmin && (
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
            <h2 className="text-heading text-base sm:text-lg">Admin Instellingen</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            Toegang tot uitgebreide salon beheer functies
          </p>
          <Link href="/admin/settings">
            <button className="btn-primary text-xs sm:text-sm w-full sm:w-auto">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              Open Admin Instellingen
            </button>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-2 sm:gap-4 lg:gap-8 px-3 sm:px-4 lg:px-6 overflow-x-auto" aria-label="Tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[40px] sm:min-h-[48px] ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">
                  {tab.id === 'business' && 'Info'}
                  {tab.id === 'hours' && 'Tijden'}
                  {tab.id === 'notifications' && 'Meldingen'}
                  {tab.id === 'booking' && 'Boeken'}
                  {tab.id === 'payment' && 'Betaal'}
                  {tab.id === 'tax' && 'BTW'}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4 lg:p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}