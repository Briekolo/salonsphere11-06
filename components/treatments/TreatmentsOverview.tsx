'use client'

import { useState } from 'react'
import { Clock, Euro, Edit, Star, Calendar, Users } from 'lucide-react'

interface Treatment {
  id: string
  name: string
  category: string
  description: string
  duration: number
  price: number
  materialCost: number
  margin: number
  image: string
  popularity: number
  bookingsThisMonth: number
  rating: number
  preparationInfo?: string
  aftercareInfo?: string
  productsUsed: string[]
  certifications: string[]
}

interface TreatmentsOverviewProps {
  onTreatmentEdit: (treatmentId: string) => void
}

const treatments: Treatment[] = [
  {
    id: '1',
    name: 'Klassieke Pedicure',
    category: 'Nagelverzorging',
    description: 'Een complete voetbehandeling inclusief nagelverzorging, eeltverwijdering en ontspannende voetmassage.',
    duration: 45,
    price: 65,
    materialCost: 12,
    margin: 81.5,
    image: 'https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    popularity: 92,
    bookingsThisMonth: 28,
    rating: 4.8,
    preparationInfo: 'Zorg voor schone voeten, vermijd crème 24u voor behandeling',
    aftercareInfo: 'Houd voeten droog eerste 2 uur, gebruik aanbevolen voetcrème',
    productsUsed: ['OPI Base Coat', 'Essie Nagellak', 'CND Top Coat'],
    certifications: ['NAILS Gecertificeerd', 'Hygiëne Standaard A+']
  },
  {
    id: '2',
    name: 'Luxe Manicure',
    category: 'Nagelverzorging',
    description: 'Professionele handverzorging met nagelbehandeling, cuticle care en handmassage voor perfecte handen.',
    duration: 60,
    price: 55,
    materialCost: 8,
    margin: 85.5,
    image: 'https://images.pexels.com/photos/3997376/pexels-photo-3997376.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    popularity: 88,
    bookingsThisMonth: 24,
    rating: 4.9,
    preparationInfo: 'Verwijder oude nagellak, vermijd handcrème dag van behandeling',
    aftercareInfo: 'Draag handschoenen bij huishoudelijk werk, gebruik cuticle oil dagelijks',
    productsUsed: ['Shellac Base', 'CND Vinylux', 'Solar Oil'],
    certifications: ['NAILS Professional', 'Beauty Therapy Level 3']
  },
  {
    id: '3',
    name: 'Anti-Aging Gezichtsbehandeling',
    category: 'Gezichtsbehandelingen',
    description: 'Intensieve behandeling tegen veroudering met peptiden en hyaluronzuur voor een stralende, jeugdige huid.',
    duration: 90,
    price: 125,
    materialCost: 25,
    margin: 80,
    image: 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    popularity: 76,
    bookingsThisMonth: 18,
    rating: 4.7,
    preparationInfo: 'Geen retinol 48u voor behandeling, kom onopgemaakt',
    aftercareInfo: 'Gebruik SPF 30+, vermijd direct zonlicht 24u',
    productsUsed: ['Dermalogica Age Smart', 'Environ Vitamin A', 'Murad Hydration'],
    certifications: ['CIDESCO Diploma', 'Dermalogica Expert']
  },
  {
    id: '4',
    name: 'Ontspanningsmassage',
    category: 'Massage',
    description: 'Volledige lichaamsmassage voor diepe ontspanning en stressvermindering met aromatherapie oliën.',
    duration: 75,
    price: 95,
    materialCost: 15,
    margin: 84.2,
    image: 'https://images.pexels.com/photos/3997991/pexels-photo-3997991.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    popularity: 84,
    bookingsThisMonth: 22,
    rating: 4.8,
    preparationInfo: 'Eet niet zwaar 2u voor massage, draag comfortabele kleding',
    aftercareInfo: 'Drink veel water, rust 30 minuten na behandeling',
    productsUsed: ['Aromatherapy Associates', 'Neal\'s Yard', 'Organic Massage Oils'],
    certifications: ['ITEC Massage Therapy', 'Aromatherapy Certified']
  },
  {
    id: '5',
    name: 'Brazilian Wax',
    category: 'Ontharing',
    description: 'Professionele ontharing van het intieme gebied met hoogwaardige wax voor langdurig gladde huid.',
    duration: 30,
    price: 45,
    materialCost: 6,
    margin: 86.7,
    image: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    popularity: 71,
    bookingsThisMonth: 16,
    rating: 4.6,
    preparationInfo: 'Haar moet 5mm lang zijn, exfolieer 24u van tevoren',
    aftercareInfo: 'Vermijd hete douches 24u, gebruik kalmerende lotion',
    productsUsed: ['Lycon Wax', 'Ingrown-Go', 'Soothing Lotion'],
    certifications: ['Waxing Specialist', 'Intimate Care Certified']
  },
  {
    id: '6',
    name: 'Hydraterende Gezichtsbehandeling',
    category: 'Gezichtsbehandelingen',
    description: 'Intensieve hydratatie voor droge huid met hyaluronzuur masker en vochtinbrengende serums.',
    duration: 60,
    price: 75,
    materialCost: 18,
    margin: 76,
    image: 'https://images.pexels.com/photos/3985327/pexels-photo-3985327.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    popularity: 79,
    bookingsThisMonth: 20,
    rating: 4.7,
    preparationInfo: 'Kom onopgemaakt, vermijd scrubs 48u voor behandeling',
    aftercareInfo: 'Gebruik aanbevolen serums, drink veel water',
    productsUsed: ['Hyaluronic Acid Serum', 'Hydrating Mask', 'Moisture Barrier Cream'],
    certifications: ['Skincare Specialist', 'Hydration Expert']
  }
]

const categories = [
  { name: 'Alle', count: treatments.length },
  { name: 'Nagelverzorging', count: treatments.filter(t => t.category === 'Nagelverzorging').length },
  { name: 'Gezichtsbehandelingen', count: treatments.filter(t => t.category === 'Gezichtsbehandelingen').length },
  { name: 'Massage', count: treatments.filter(t => t.category === 'Massage').length },
  { name: 'Ontharing', count: treatments.filter(t => t.category === 'Ontharing').length }
]

export function TreatmentsOverview({ onTreatmentEdit }: TreatmentsOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const filteredTreatments = selectedCategory === 'Alle' 
    ? treatments 
    : treatments.filter(t => t.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Onze Behandelingen
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Bij SalonSphere geloven we in de kracht van professionele schoonheidsverzorging. 
            Onze ervaren specialisten gebruiken alleen de beste producten en technieken om u 
            de ultieme wellness-ervaring te bieden.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>Gecertificeerde specialisten</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>Premium producten</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>Hygiëne standaard A+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.name
                ? 'bg-[#02011F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              selectedCategory === category.name
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Treatments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTreatments.map((treatment) => (
          <div key={treatment.id} className="card group cursor-pointer" onClick={() => onTreatmentEdit(treatment.id)}>
            {/* Treatment Image */}
            <div className="relative mb-4 overflow-hidden rounded-lg">
              <img 
                src={treatment.image} 
                alt={treatment.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                {treatment.popularity}% populair
              </div>
            </div>

            {/* Treatment Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{treatment.name}</h3>
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {treatment.category}
                  </span>
                </div>
                <button 
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTreatmentEdit(treatment.id)
                  }}
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">
                {treatment.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Clock className="w-3 h-3" />
                    {treatment.duration}min
                  </div>
                  <div className="text-xs text-gray-600">Duur</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Euro className="w-3 h-3" />
                    {treatment.price}
                  </div>
                  <div className="text-xs text-gray-600">Prijs</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Calendar className="w-3 h-3" />
                    {treatment.bookingsThisMonth}
                  </div>
                  <div className="text-xs text-gray-600">Deze maand</div>
                </div>
              </div>

              {/* Rating and Margin */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{treatment.rating}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Marge: </span>
                  <span className="font-medium text-green-600">{treatment.margin}%</span>
                </div>
              </div>

              {/* Products Used */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Gebruikte producten:</div>
                <div className="flex flex-wrap gap-1">
                  {treatment.productsUsed.slice(0, 2).map((product, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {product}
                    </span>
                  ))}
                  {treatment.productsUsed.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{treatment.productsUsed.length - 2} meer
                    </span>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Certificeringen:</div>
                <div className="flex flex-wrap gap-1">
                  {treatment.certifications.map((cert, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                      <Star className="w-2 h-2 fill-current" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-4 btn-outlined">
              Afspraak boeken
            </button>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Klaar voor uw volgende behandeling?
          </h2>
          <p className="text-gray-600 mb-6">
            Boek vandaag nog een afspraak en ervaar de SalonSphere kwaliteit
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="btn-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Afspraak boeken
            </button>
            <button className="btn-outlined flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contact opnemen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}