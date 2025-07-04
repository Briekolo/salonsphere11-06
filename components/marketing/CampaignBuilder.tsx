'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Send, Eye, Users, Calendar, Settings, Mail, Target, Clock, TestTube } from 'lucide-react'

export function CampaignBuilder() {
  const [step, setStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    template: '',
    segment: '',
    sendTime: 'now',
    scheduledDate: '',
    scheduledTime: '',
    abTest: false,
    subjectB: '',
    testPercentage: 20
  })

  const steps = [
    { id: 1, name: 'Basis', icon: <Settings className="w-4 h-4" /> },
    { id: 2, name: 'Sjabloon', icon: <Mail className="w-4 h-4" /> },
    { id: 3, name: 'Doelgroep', icon: <Target className="w-4 h-4" /> },
    { id: 4, name: 'Planning', icon: <Clock className="w-4 h-4" /> },
    { id: 5, name: 'Review', icon: <Eye className="w-4 h-4" /> }
  ]

  const templates = [
    {
      id: '1',
      name: 'Lente Specials',
      category: 'Promotie',
      image: 'https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
    },
    {
      id: '2',
      name: 'Afspraak Bevestiging',
      category: 'Automatisch',
      image: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
    },
    {
      id: '3',
      name: 'Nieuwsbrief',
      category: 'Informatief',
      image: 'https://images.pexels.com/photos/3997991/pexels-photo-3997991.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
    }
  ]

  const segments = [
    { id: '1', name: 'Alle Klanten', count: 1247, description: 'Alle actieve klanten in uw database' },
    { id: '2', name: 'VIP Klanten', count: 156, description: 'Klanten met hoge uitgaven en loyaliteit' },
    { id: '3', name: 'Nieuwe Klanten', count: 89, description: 'Klanten die zich recent hebben aangemeld' },
    { id: '4', name: 'Inactieve Klanten', count: 234, description: 'Klanten die lange tijd geen afspraak hebben gehad' }
  ]

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSaveDraft = () => {
    console.log('Campaign saved as draft:', campaignData)
  }

  const handleSendCampaign = () => {
    console.log('Campaign sent:', campaignData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nieuwe Campagne</h1>
            <p className="text-gray-600">Maak een professionele e-mailcampagne in 5 eenvoudige stappen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveDraft} className="btn-outlined flex items-center gap-2">
            <Save className="w-4 h-4" />
            Concept Opslaan
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-center">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                step >= stepItem.id ? 'bg-primary-100 text-primary-700' : 'text-gray-500'
              }`}>
                {stepItem.icon}
                <span className="font-medium">{stepItem.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  step > stepItem.id ? 'bg-primary-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Campagne Basisinformatie</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campagne Naam *
                  </label>
                  <input
                    type="text"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. Lente Specials 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Onderwerpsregel *
                  </label>
                  <input
                    type="text"
                    value={campaignData.subject}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. 🌸 Lente Specials - 20% korting op alle behandelingen!"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Tip: Gebruik emoji&apos;s en personalisatie voor hogere open rates
                  </p>
                </div>

                {/* A/B Testing */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="abTest"
                      checked={campaignData.abTest}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, abTest: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="abTest" className="flex items-center gap-2 font-medium text-gray-900">
                      <TestTube className="w-4 h-4" />
                      A/B Test Onderwerpsregel
                    </label>
                  </div>
                  
                  {campaignData.abTest && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alternatieve Onderwerpsregel (Variant B)
                        </label>
                        <input
                          type="text"
                          value={campaignData.subjectB}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, subjectB: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Alternatieve onderwerpsregel voor test"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Percentage: {campaignData.testPercentage}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="50"
                          value={campaignData.testPercentage}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, testPercentage: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          {campaignData.testPercentage}% krijgt variant A, {campaignData.testPercentage}% krijgt variant B, 
                          de rest krijgt de winnende variant na 4 uur
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {step === 2 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Kies een Sjabloon</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setCampaignData(prev => ({ ...prev, template: template.id }))}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      campaignData.template === template.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={template.image} 
                      alt={template.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <span className="text-sm text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                      {template.category}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Aangepast Sjabloon</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Wilt u een volledig aangepast sjabloon maken? Gebruik onze drag-and-drop editor.
                </p>
                <button className="btn-outlined text-sm">
                  Aangepast Sjabloon Maken
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Audience Selection */}
          {step === 3 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Selecteer Doelgroep</h2>
              
              <div className="space-y-4">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    onClick={() => setCampaignData(prev => ({ ...prev, segment: segment.id }))}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      campaignData.segment === segment.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{segment.name}</h3>
                        <p className="text-sm text-gray-600">{segment.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">{segment.count.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">ontvangers</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Geavanceerde Segmentatie</h4>
                <p className="text-sm text-green-800 mb-3">
                  Maak aangepaste segmenten op basis van gedrag, voorkeuren en demografische gegevens.
                </p>
                <button className="btn-outlined text-sm">
                  Aangepast Segment Maken
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Scheduling */}
          {step === 4 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Planning & Verzending</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Wanneer wilt u de campagne verzenden?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="sendTime"
                        value="now"
                        checked={campaignData.sendTime === 'now'}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, sendTime: e.target.value }))}
                        className="text-primary-500 focus:ring-primary-500"
                      />
                      <span>Direct verzenden</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="sendTime"
                        value="scheduled"
                        checked={campaignData.sendTime === 'scheduled'}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, sendTime: e.target.value }))}
                        className="text-primary-500 focus:ring-primary-500"
                      />
                      <span>Inplannen voor later</span>
                    </label>
                  </div>
                </div>

                {campaignData.sendTime === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Datum
                      </label>
                      <input
                        type="date"
                        value={campaignData.scheduledDate}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tijd
                      </label>
                      <input
                        type="time"
                        value={campaignData.scheduledTime}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Optimale Verzendtijden</h4>
                  <p className="text-sm text-yellow-800">
                    Op basis van uw klantgegevens zijn de beste verzendtijden:
                  </p>
                  <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                    <li>• Dinsdag tot donderdag tussen 10:00 - 11:00</li>
                    <li>• Zaterdag tussen 14:00 - 16:00</li>
                    <li>• Vermijd maandagochtend en vrijdagavond</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Campagne Overzicht</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Campagne Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Naam:</span>
                        <span>{campaignData.name || 'Niet ingesteld'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Onderwerp:</span>
                        <span>{campaignData.subject || 'Niet ingesteld'}</span>
                      </div>
                      {campaignData.abTest && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">A/B Test:</span>
                          <span className="text-green-600">Actief ({campaignData.testPercentage}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Doelgroep & Planning</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Segment:</span>
                        <span>{segments.find(s => s.id === campaignData.segment)?.name || 'Niet geselecteerd'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ontvangers:</span>
                        <span>{segments.find(s => s.id === campaignData.segment)?.count.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verzending:</span>
                        <span>{campaignData.sendTime === 'now' ? 'Direct' : 'Ingepland'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Geschatte Prestaties</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {Math.round((segments.find(s => s.id === campaignData.segment)?.count || 0) * 0.248)}
                      </div>
                      <div className="text-sm text-gray-600">Verwachte Opens</div>
                      <div className="text-xs text-gray-500">24.8% open rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((segments.find(s => s.id === campaignData.segment)?.count || 0) * 0.038)}
                      </div>
                      <div className="text-sm text-gray-600">Verwachte Clicks</div>
                      <div className="text-xs text-gray-500">3.8% click rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((segments.find(s => s.id === campaignData.segment)?.count || 0) * 0.012)}
                      </div>
                      <div className="text-sm text-gray-600">Verwachte Conversies</div>
                      <div className="text-xs text-gray-500">1.2% conversie rate</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSendCampaign}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {campaignData.sendTime === 'now' ? 'Campagne Verzenden' : 'Campagne Inplannen'}
                  </button>
                  <button className="btn-outlined flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Test E-mail Verzenden
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Campagne Voortgang</h3>
            
            <div className="space-y-4">
              {steps.map((stepItem) => (
                <div key={stepItem.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step > stepItem.id ? 'bg-green-500 text-white' :
                    step === stepItem.id ? 'bg-primary-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > stepItem.id ? '✓' : stepItem.id}
                  </div>
                  <span className={`font-medium ${
                    step >= stepItem.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepItem.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button 
                    onClick={handlePrevious}
                    className="flex-1 btn-outlined"
                  >
                    Vorige
                  </button>
                )}
                {step < 5 && (
                  <button 
                    onClick={handleNext}
                    className="flex-1 btn-primary"
                  >
                    Volgende
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card mt-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Tips voor Succes</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Gebruik een duidelijke en verleidelijke onderwerpsregel</li>
              <li>• Personaliseer uw e-mails met klantnamen</li>
              <li>• Test verschillende verzendtijden</li>
              <li>• Voeg een duidelijke call-to-action toe</li>
              <li>• Zorg voor mobiel-vriendelijke content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}