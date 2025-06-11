'use client'

import { useState } from 'react'
import { MarketingDashboard } from './MarketingDashboard'
import { CampaignBuilder } from './CampaignBuilder'
import { EmailTemplates } from './EmailTemplates'
import { CustomerSegmentation } from './CustomerSegmentation'
import { CampaignAnalytics } from './CampaignAnalytics'
import { AutomationWorkflows } from './AutomationWorkflows'
import { MarketingStats } from './MarketingStats'

export function MarketingContent() {
  const [activeView, setActiveView] = useState<'dashboard' | 'campaigns' | 'templates' | 'segments' | 'analytics' | 'automation'>('dashboard')

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Quick Stats */}
      <MarketingStats />
      
      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'dashboard'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
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
          onClick={() => setActiveView('segments')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'segments'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Segmentatie
        </button>
        <button
          onClick={() => setActiveView('automation')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'automation'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Automatisering
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
            activeView === 'analytics'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Main Content */}
      {activeView === 'dashboard' && <MarketingDashboard onViewChange={setActiveView} />}
      {activeView === 'campaigns' && <CampaignBuilder />}
      {activeView === 'templates' && <EmailTemplates />}
      {activeView === 'segments' && <CustomerSegmentation />}
      {activeView === 'automation' && <AutomationWorkflows />}
      {activeView === 'analytics' && <CampaignAnalytics />}
    </div>
  )
}