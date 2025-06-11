'use client'

import { useState } from 'react'
import { Plus, Play, Pause, Edit, Trash2, Calendar, Mail, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export function AutomationWorkflows() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  const workflows = [
    {
      id: '1',
      name: 'Welkom Serie Nieuwe Klanten',
      description: 'Automatische welkomstreeks voor nieuwe klanten',
      status: 'active',
      trigger: 'Nieuwe klant registratie',
      emails: 3,
      recipients: 89,
      openRate: 67.3,
      clickRate: 18.9,
      conversions: 23,
      lastRun: '2024-01-15',
      steps: [
        { id: 1, type: 'email', name: 'Welkom e-mail', delay: '0 dagen', status: 'active' },
        { id: 2, type: 'email', name: 'Salon introductie', delay: '3 dagen', status: 'active' },
        { id: 3, type: 'email', name: 'Eerste afspraak aanbieding', delay: '7 dagen', status: 'active' }
      ]
    },
    {
      id: '2',
      name: 'Afspraak Herinneringen',
      description: 'Automatische herinneringen voor geplande afspraken',
      status: 'active',
      trigger: 'Afspraak geboekt',
      emails: 2,
      recipients: 445,
      openRate: 92.1,
      clickRate: 8.7,
      conversions: 387,
      lastRun: '2024-01-16',
      steps: [
        { id: 1, type: 'email', name: 'Bevestiging afspraak', delay: '0 dagen', status: 'active' },
        { id: 2, type: 'email', name: 'Herinnering 24u', delay: '1 dag voor', status: 'active' }
      ]
    },
    {
      id: '3',
      name: 'Verjaardags Campagne',
      description: 'Persoonlijke verjaardagswensen met speciale aanbieding',
      status: 'active',
      trigger: 'Klant verjaardag',
      emails: 1,
      recipients: 67,
      openRate: 78.9,
      clickRate: 18.7,
      conversions: 12,
      lastRun: '2024-01-14',
      steps: [
        { id: 1, type: 'email', name: 'Verjaardags e-mail', delay: '0 dagen', status: 'active' }
      ]
    },
    {
      id: '4',
      name: 'Win-Back Inactieve Klanten',
      description: 'Reactivatie campagne voor klanten die lang weggebleven zijn',
      status: 'paused',
      trigger: 'Geen bezoek 90 dagen',
      emails: 3,
      recipients: 234,
      openRate: 28.7,
      clickRate: 6.2,
      conversions: 8,
      lastRun: '2024-01-08',
      steps: [
        { id: 1, type: 'email', name: 'We missen je', delay: '0 dagen', status: 'active' },
        { id: 2, type: 'email', name: 'Speciale comeback aanbieding', delay: '7 dagen', status: 'active' },
        { id: 3, type: 'email', name: 'Laatste kans', delay: '14 dagen', status: 'active' }
      ]
    },
    {
      id: '5',
      name: 'Post-Behandeling Follow-up',
      description: 'Nazorg en feedback na behandelingen',
      status: 'active',
      trigger: 'Behandeling voltooid',
      emails: 2,
      recipients: 156,
      openRate: 54.2,
      clickRate: 12.3,
      conversions: 34,
      lastRun: '2024-01-15',
      steps: [
        { id: 1, type: 'email', name: 'Nazorg instructies', delay: '1 dag', status: 'active' },
        { id: 2, type: 'email', name: 'Feedback verzoek', delay: '7 dagen', status: 'active' }
      ]
    }
  ]

  const workflowTemplates = [
    {
      id: 'welcome',
      name: 'Welkom Serie',
      description: 'Verwelkom nieuwe klanten met een serie e-mails',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      id: 'appointment',
      name: 'Afspraak Workflow',
      description: 'Automatische bevestigingen en herinneringen',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      id: 'birthday',
      name: 'Verjaardag Campagne',
      description: 'Persoonlijke verjaardagswensen',
      icon: <Mail className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      id: 'winback',
      name: 'Win-Back Serie',
      description: 'Reactiveer inactieve klanten',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-orange-500'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actief'
      case 'paused': return 'Gepauzeerd'
      case 'draft': return 'Concept'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Automatisering</h1>
          <p className="text-gray-600">Stel automatische e-mail workflows in voor efficiënte klantcommunicatie</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nieuwe Workflow
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Play className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">4</div>
          <div className="text-sm text-gray-600">Actieve Workflows</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">2,847</div>
          <div className="text-sm text-gray-600">E-mails Verzonden</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">464</div>
          <div className="text-sm text-gray-600">Conversies</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">18.5h</div>
          <div className="text-sm text-gray-600">Tijd Bespaard</div>
        </div>
      </div>

      {/* Workflow Templates */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Workflow Sjablonen</h2>
        <div className="grid grid-cols-4 gap-4">
          {workflowTemplates.map((template) => (
            <button
              key={template.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
            >
              <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                {template.icon}
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Workflows */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Actieve Workflows</h2>
        
        {workflows.map((workflow) => (
          <div key={workflow.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                  <span className={`status-chip ${getStatusColor(workflow.status)}`}>
                    {getStatusText(workflow.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {workflow.emails} e-mails
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {workflow.recipients} ontvangers
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Laatste run: {new Date(workflow.lastRun).toLocaleDateString('nl-NL')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {workflow.status === 'active' ? (
                    <Pause className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Play className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-4 py-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{workflow.openRate}%</div>
                <div className="text-xs text-gray-600">Open Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{workflow.clickRate}%</div>
                <div className="text-xs text-gray-600">Click Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{workflow.conversions}</div>
                <div className="text-xs text-gray-600">Conversies</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {((workflow.conversions / workflow.recipients) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Conversie Rate</div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Workflow Stappen</h4>
                <button 
                  onClick={() => setSelectedWorkflow(selectedWorkflow === workflow.id ? null : workflow.id)}
                  className="text-sm text-primary-500 hover:text-primary-700"
                >
                  {selectedWorkflow === workflow.id ? 'Verbergen' : 'Details bekijken'}
                </button>
              </div>
              
              {selectedWorkflow === workflow.id && (
                <div className="space-y-3">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{step.name}</div>
                        <div className="text-sm text-gray-600">Vertraging: {step.delay}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`status-chip ${getStatusColor(step.status)}`}>
                          {getStatusText(step.status)}
                        </span>
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Automation Tips */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Automatisering Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Test uw workflows eerst met een kleine groep</li>
              <li>• Personaliseer e-mails met klantgegevens voor betere resultaten</li>
              <li>• Monitor prestaties regelmatig en optimaliseer waar nodig</li>
              <li>• Zorg voor consistente branding in alle geautomatiseerde e-mails</li>
              <li>• Respecteer klantvoorkeuren en bied altijd een uitschrijfoptie</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}