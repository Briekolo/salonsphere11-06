'use client';

import { useState, useEffect, use } from 'react';
import { 
  Search, 
  Clock, 
  Euro, 
  Calendar,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  Info,
  Loader2,
  Star,
  TrendingUp,
  Users,
  Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCategoryBadgeClasses } from '@/lib/utils/categoryColors';
import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/client/tenant-context';

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  price: number;
  image_url?: string | null;
  treatments_needed?: number | null;
  treatment_interval_weeks?: number | null;
  popular?: boolean;
  certifications?: string[] | null;
  // Additional fields from database schema
  active?: boolean | null;
  aftercare_info?: string | null;
  created_at?: string | null;
  material_cost?: number | null;
  preparation_info?: string | null;
  products_used?: string[] | null;
  tenant_id?: string;
  updated_at?: string | null;
  treatment_categories?: {
    id: string;
    name: string;
    color?: string;
  } | null;
}

export default function ServicesPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name');

  useEffect(() => {
    if (tenant?.id) {
      fetchServices();
    }
  }, [tenant]);

  const fetchServices = async () => {
    if (!tenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          treatment_categories!category_id (
            id,
            name,
            color
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Alle', ...Array.from(new Set(services.map(s => s.treatment_categories?.name || s.category)))];

  const filteredServices = services
    .filter(service => {
      const matchesSearch = searchTerm === '' || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'Alle' || (service.treatment_categories?.name || service.category) === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration_minutes - b.duration_minutes;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}min` : `${hours} uur`;
  };

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Even geduld, we laden de behandelingen...</p>
        </div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Er is iets misgegaan bij het laden van de behandelingen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Hero Section - Simplified like admin */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-medium text-[#010009] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
              Onze Behandelingen
            </h1>
            <p className="text-base text-gray-600 mb-6">
              Ontdek ons uitgebreide aanbod aan professionele beauty behandelingen
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek een behandeling..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent transition-all duration-200"
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Sort */}
        <div className="mb-6">
          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center justify-between gap-4 mb-4">
            {/* Category Pills - Admin style toggle */}
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-full">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-[#02011F] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                  {category}
                  {category !== 'Alle' && (
                    <span className="ml-1.5 text-xs">
                      ({services.filter(s => (s.treatment_categories?.name || s.category) === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
              style={{ minHeight: '40px' }}
            >
              <option value="name">Sorteer op naam</option>
              <option value="price">Sorteer op prijs</option>
              <option value="duration">Sorteer op duur</option>
            </select>
          </div>

          {/* Mobile Filter Button */}
          <div className="sm:hidden flex items-center justify-between mb-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium"
              style={{ minHeight: '44px' }}
            >
              <Filter className="h-4 w-4" />
              Filters
              {selectedCategory !== 'Alle' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {selectedCategory}
                </span>
              )}
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700"
              style={{ minHeight: '44px' }}
            >
              <option value="name">Naam</option>
              <option value="price">Prijs</option>
              <option value="duration">Duur</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredServices.length} behandeling{filteredServices.length !== 1 ? 'en' : ''} gevonden
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-[#02011F] hover:opacity-80 font-medium"
              >
                Wis zoekopdracht
              </button>
            )}
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#010009] mb-2">Geen behandelingen gevonden</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              Probeer een andere zoekterm of filter om behandelingen te vinden.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map(service => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:transform hover:-translate-y-0.5"
                style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '2px 8px 16px rgba(0, 0, 0, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '1px 4px 8px rgba(0, 0, 0, 0.04)'}
              >
                {/* Service Image */}
                <div className="relative h-48 bg-gray-50 overflow-hidden">
                  {service.image_url ? (
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E3ECFB] rounded-xl mb-3">
                          <Sparkles className="h-8 w-8 text-[#7091D9]" />
                        </div>
                        <p className="text-sm text-gray-600">{service.treatment_categories?.name || service.category}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Popular Badge */}
                  {service.popular && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] text-xs font-medium rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      Populair
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6">
                  {/* Category Badge */}
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full mb-3 ${getCategoryBadgeClasses(service.treatment_categories?.color)}`}>
                    {service.treatment_categories?.name || service.category}
                  </span>
                  
                  {/* Service Name */}
                  <h3 className="text-lg font-medium text-[#010009] mb-2" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                    {service.name}
                  </h3>

                  {/* Description */}
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Treatment Sessions Info */}
                  {service.treatments_needed && service.treatments_needed > 1 && (
                    <div className="mb-4 p-3 bg-[#E3ECFB] rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-[#7091D9] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-xs">
                          <p className="font-medium text-[#010009]">
                            {service.treatments_needed} behandelingen aanbevolen
                          </p>
                          <p className="text-gray-600 mt-0.5">
                            Om de {service.treatment_interval_weeks} weken voor optimaal resultaat
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Details */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{formatDuration(service.duration_minutes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4 text-gray-600" />
                        <span className="text-lg font-medium text-[#010009]">{service.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Link href={`/${resolvedParams.domain}/book?service=${service.id}`}>
                    <button className="w-full bg-[#02011F] text-white font-medium py-3 px-4 rounded-2xl sm:rounded-full hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2"
                      style={{ fontFamily: 'Outfit, Inter, sans-serif', minHeight: '44px' }}>
                      <Calendar className="h-4 w-4" />
                      Boek deze behandeling
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden"
            style={{ boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)' }}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#010009]">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="px-4 py-4 overflow-y-auto">
              <h4 className="text-sm font-medium text-[#010009] mb-3">Categorie</h4>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-gray-100 text-[#010009] font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{category}</span>
                    {category !== 'Alle' && (
                      <span className="text-sm text-gray-500">
                        {services.filter(s => (s.treatment_categories?.name || s.category) === category).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}