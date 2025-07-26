'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/client/tenant-context';
import { supabase } from '@/lib/supabase';
import { getCategoryBadgeClasses } from '@/lib/utils/categoryColors';
import { 
  Search, 
  Clock, 
  Euro, 
  ChevronRight,
  Filter,
  X,
  Loader2,
  Info,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  User,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  price: number;
  image_url?: string | null;
  treatments_needed?: number;
  treatment_interval_weeks?: number;
  min_advance_hours?: number;
  max_advance_days?: number;
  popular?: boolean;
  // Additional fields from database schema
  aantal_sessies?: number | null;
  active?: boolean | null;
  aftercare_info?: string | null;
  certifications?: string[] | null;
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

interface Category {
  name: string;
  count: number;
  icon?: string;
}

export default function BookServicePage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('service');
  
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Auto-navigate if service is preselected
  useEffect(() => {
    if (preselectedServiceId && !loading && services.length > 0) {
      const service = services.find(s => s.id === preselectedServiceId);
      if (service) {
        handleServiceSelect(preselectedServiceId);
      }
    }
  }, [preselectedServiceId, loading, services]);

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

      // Extract unique categories
      const categoryMap = new Map<string, number>();
      (data || []).forEach(service => {
        const categoryName = service.treatment_categories?.name || service.category;
        const count = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, count + 1);
      });

      const categoryList = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }));

      setCategories([
        { name: 'Alle', count: data?.length || 0 },
        ...categoryList
      ]);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === '' || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Alle' || (service.treatment_categories?.name || service.category) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = (serviceId: string) => {
    router.push(`/${resolvedParams.domain}/book/${serviceId}`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}min` : `${hours} uur`;
  };

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E3ECFB] rounded-xl mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#7091D9]" />
          </div>
          <p className="text-base text-gray-600">Services laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Steps Indicator */}
          <div className="py-4">
            <div className="flex items-center justify-center space-x-3">
              {/* Step 1 - Active */}
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-[#02011F] text-white rounded-full text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-[#010009] hidden sm:inline">Behandeling</span>
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-300" />
              
              {/* Step 2 */}
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm">
                  2
                </div>
                <span className="ml-2 text-sm text-gray-600 hidden sm:inline">Medewerker</span>
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-300" />
              
              {/* Step 3 */}
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm">
                  3
                </div>
                <span className="ml-2 text-sm text-gray-600 hidden sm:inline">Datum & Tijd</span>
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-300" />
              
              {/* Step 4 */}
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm">
                  4
                </div>
                <span className="ml-2 text-sm text-gray-600 hidden sm:inline">Bevestiging</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-medium text-[#010009] mb-2" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
            Kies uw behandeling
          </h1>
          <p className="text-base text-gray-600">
            Selecteer de gewenste behandeling om door te gaan met het boeken van uw afspraak
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek een behandeling..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent transition-all duration-200"
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Category Pills - Desktop */}
          <div className="hidden sm:block">
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-full">
              {categories.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-[#02011F] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
                >
                  {category.name}
                  <span className="ml-1.5 text-xs">
                    ({category.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="sm:hidden flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium"
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
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#010009] mb-2">Geen behandelingen gevonden</h3>
            <p className="text-gray-600">
              Probeer een andere zoekterm of categorie
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map(service => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className="bg-white rounded-2xl overflow-hidden text-left group transition-all duration-200 hover:transform hover:-translate-y-0.5"
                style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '2px 8px 16px rgba(0, 0, 0, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '1px 4px 8px rgba(0, 0, 0, 0.04)'}
              >
                {/* Service Image */}
                <div className="relative h-40 bg-gray-50 overflow-hidden">
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
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-2">
                          <Sparkles className="h-6 w-6 text-[#7091D9]" />
                        </div>
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

                <div className="p-4">
                  {/* Category Badge */}
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full mb-3 ${getCategoryBadgeClasses(service.treatment_categories?.color)}`}>
                    {service.treatment_categories?.name || service.category}
                  </span>

                  {/* Service Name */}
                  <h3 className="text-lg font-medium text-[#010009] mb-2" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                    {service.name}
                  </h3>

                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Treatment Sessions Info */}
                  {service.treatments_needed && service.treatments_needed > 1 && (
                    <div className="mb-3 p-2.5 bg-[#E3ECFB] rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-[#7091D9] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-xs">
                          <p className="font-medium text-[#010009]">
                            Kuur van {service.treatments_needed} behandelingen
                          </p>
                          <p className="text-gray-600 mt-0.5">
                            Om de {service.treatment_interval_weeks} weken
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duration and Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#010009]">
                        <Euro className="h-4 w-4 text-gray-600" />
                        {service.price.toFixed(2)}
                      </span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#7091D9] group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </button>
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
                <h3 className="text-lg font-medium text-[#010009]">Categorieën</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="px-4 py-4 overflow-y-auto">
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      selectedCategory === category.name
                        ? 'bg-gray-100 text-[#010009] font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500">
                      {category.count}
                    </span>
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