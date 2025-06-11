'use client'

import { useState } from 'react'
import { Eye, Edit, Copy, Star, Calendar, Gift, Heart, Sparkles, Users, Mail } from 'lucide-react'

export function EmailTemplates() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const templates = [
    {
      id: '1',
      name: 'Afspraak Bevestiging',
      category: 'Afspraken',
      description: 'Automatische bevestiging van geboekte afspraken',
      image: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 89.2,
      clickRate: 12.4,
      usage: 156,
      type: 'Automatisch',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      id: '2',
      name: 'Lente Specials',
      category: 'Promoties',
      description: 'Seizoensgebonden aanbiedingen voor lente behandelingen',
      image: 'https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 34.7,
      clickRate: 8.9,
      usage: 89,
      type: 'Promotie',
      icon: <Gift className="w-5 h-5" />
    },
    {
      id: '3',
      name: 'Welkom Nieuwe Klant',
      category: 'Onboarding',
      description: 'Verwelkoming voor nieuwe klanten met introductie salon',
      image: 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 67.3,
      clickRate: 23.1,
      usage: 234,
      type: 'Automatisch',
      icon: <Heart className="w-5 h-5" />
    },
    {
      id: '4',
      name: 'Verjaardag Aanbieding',
      category: 'Speciale Gelegenheden',
      description: 'Persoonlijke verjaardagswensen met speciale korting',
      image: 'https://images.pexels.com/photos/3997376/pexels-photo-3997376.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 78.9,
      clickRate: 18.7,
      usage: 67,
      type: 'Automatisch',
      icon: <Gift className="w-5 h-5" />
    },
    {
      id: '5',
      name: 'Anti-Aging Behandelingen',
      category: 'Behandelingen',
      description: 'Showcase van anti-aging behandelingen en resultaten',
      image: 'https://images.pexels.com/photos/3985327/pexels-photo-3985327.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 42.1,
      clickRate: 11.3,
      usage: 45,
      type: 'Promotie',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: '6',
      name: 'Maandelijkse Nieuwsbrief',
      category: 'Nieuwsbrieven',
      description: 'Maandelijks overzicht van nieuws, tips en aanbiedingen',
      image: 'https://images.pexels.com/photos/3997991/pexels-photo-3997991.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 28.4,
      clickRate: 6.2,
      usage: 123,
      type: 'Nieuwsbrief',
      icon: <Mail className="w-5 h-5" />
    },
    {
      id: '7',
      name: 'VIP Klant Uitnodiging',
      category: 'VIP',
      description: 'Exclusieve uitnodiging voor VIP evenementen en previews',
      image: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 85.6,
      clickRate: 34.2,
      usage: 23,
      type: 'Exclusief',
      icon: <Star className="w-5 h-5" />
    },
    {
      id: '8',
      name: 'Afspraak Herinnering',
      category: 'Afspraken',
      description: 'Automatische herinnering 24u voor afspraak',
      image: 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      openRate: 92.1,
      clickRate: 8.7,
      usage: 445,
      type: 'Automatisch',
      icon: <Calendar className="w-5 h-5" />
    }
  ]

  const categories = [
    { id: 'all', name: 'Alle Sjablonen', count: templates.length },
    { id: 'Afspraken', name: 'Afspraken', count: templates.filter(t => t.category === 'Afspraken').length },
    { id: 'Promoties', name: 'Promoties', count: templates.filter(t => t.category === 'Promoties').length },
    { id: 'Onboarding', name: 'Onboarding', count: templates.filter(t => t.category === 'Onboarding').length },
    { id: 'Behandelingen', name: 'Behandelingen', count: templates.filter(t => t.category === 'Behandelingen').length },
    { id: 'VIP', name: 'VIP', count: templates.filter(t => t.category === 'VIP').length }
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-mail Sjablonen</h1>
          <p className="text-gray-600">Professionele sjablonen speciaal ontworpen voor salons</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Aangepast Sjabloon Maken
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek sjablonen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-[#02011F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              selectedCategory === category.id
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card group hover:shadow-lg transition-all duration-200">
            {/* Template Preview */}
            <div className="relative mb-4 overflow-hidden rounded-lg">
              <img 
                src={template.image} 
                alt={template.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-opacity duration-200 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                {template.type}
              </div>
            </div>

            {/* Template Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">
                {template.description}
              </p>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{template.openRate}%</div>
                  <div className="text-xs text-gray-600">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{template.clickRate}%</div>
                  <div className="text-xs text-gray-600">Click Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{template.usage}</div>
                  <div className="text-xs text-gray-600">Gebruikt</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button className="flex-1 btn-primary text-sm">
                  Gebruiken
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Features */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Professionele E-mail Sjablonen
          </h2>
          <p className="text-gray-600 mb-6">
            Alle sjablonen zijn geoptimaliseerd voor mobiel, AVG-compliant en speciaal ontworpen voor de salon-industrie
          </p>
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span>Gepersonaliseerd</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span>Mobiel Geoptimaliseerd</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-primary-600" />
              <span>AVG Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}