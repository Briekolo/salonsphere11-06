'use client'

import { useState } from 'react'
import { CampaignList } from './CampaignList'
import { EmailTemplates } from './EmailTemplates'
import { CustomerSegmentation } from './CustomerSegmentation'

export function MarketingContent() {
  const [activeView, setActiveView] = useState<'campaigns' | 'templates' | 'customers'>('campaigns')

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveView('campaigns')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'campaigns'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Campagnes
        </button>
        <button
          onClick={() => setActiveView('templates')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'templates'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sjablonen
        </button>
        <button
          onClick={() => setActiveView('customers')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'customers'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Klanten
        </button>
      </div>

      {/* Main Content */}
      {activeView === 'campaigns' && <CampaignList />}
      {activeView === 'templates' && <EmailTemplates />}
      {activeView === 'customers' && <CustomerSegmentation />}
    </div>
  )
}