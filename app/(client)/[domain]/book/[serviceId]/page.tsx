'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/client/tenant-context';
import { supabase } from '@/lib/supabase';
import { 
  User,
  Star,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  image_url?: string;
  bio?: string;
  specializations?: string[];
  rating?: number;
  review_count?: number;
  proficiency_level?: string;
  custom_duration_minutes?: number;
  custom_price?: number;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export default function BookStaffPage({ 
  params 
}: { 
  params: Promise<{ domain: string; serviceId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  useEffect(() => {
    if (tenant?.id) {
      fetchServiceAndStaff();
    }
  }, [tenant]);

  const fetchServiceAndStaff = async () => {
    if (!tenant?.id) return;

    try {
      // Fetch service details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id, name, duration_minutes, price')
        .eq('id', resolvedParams.serviceId)
        .eq('tenant_id', tenant.id)
        .single();

      if (serviceError) throw serviceError;
      setService(serviceData);

      // Fetch staff members who can perform this service
      const { data: staffServices, error: staffError } = await supabase
        .from('staff_services')
        .select(`
          staff_id,
          proficiency_level,
          custom_duration_minutes,
          custom_price,
          users!staff_services_staff_id_fkey(
            id,
            first_name,
            last_name,
            email,
            image_url,
            bio,
            specializations
          )
        `)
        .eq('service_id', resolvedParams.serviceId)
        .eq('tenant_id', tenant.id)
        .eq('active', true);

      if (staffError) throw staffError;
      
      // Transform the data to include staff with their service assignments
      const staffWithServiceInfo = (staffServices || [])
        .filter(ss => ss.users)
        .map(ss => ({
          ...ss.users,
          proficiency_level: ss.proficiency_level,
          custom_duration_minutes: ss.custom_duration_minutes,
          custom_price: ss.custom_price
        }))
        .sort((a, b) => a.first_name.localeCompare(b.first_name));

      setStaff(staffWithServiceInfo);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelect = (staffId: string | null) => {
    if (staffId === 'any') {
      // Navigate without staff selection
      router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}/time`);
    } else if (staffId) {
      router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}/${staffId}`);
    }
  };

  const handleBack = () => {
    router.push(`/${resolvedParams.domain}/book`);
  };

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Medewerkers laden...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Service niet gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar services
            </button>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Kies een medewerker
            </h1>
            <p className="mt-2 text-gray-600">
              Stap 2 van 4 - Voor: {service.name}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Any available option */}
        <div className="mb-6">
          <button
            onClick={() => handleStaffSelect('any')}
            className="w-full bg-primary-50 border-2 border-primary-200 rounded-xl p-6 hover:border-primary-400 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                    Eerste beschikbare medewerker
                  </h3>
                  <p className="text-sm text-gray-600">
                    Wij kiezen de beste beschikbare specialist voor u
                  </p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-primary-600" />
            </div>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-gray-50 text-sm text-gray-500">
              Of kies een specifieke medewerker
            </span>
          </div>
        </div>

        {/* Staff grid */}
        {staff.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Geen medewerkers beschikbaar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {staff.map(member => (
              <button
                key={member.id}
                onClick={() => handleStaffSelect(member.id)}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden text-left group ${
                  selectedStaffId === member.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {member.image_url ? (
                        <Image
                          src={member.image_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {member.first_name} {member.last_name}
                      </h3>
                      
                      {/* Proficiency Level */}
                      {member.proficiency_level && (
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            member.proficiency_level === 'expert' ? 'bg-green-100 text-green-800' :
                            member.proficiency_level === 'senior' ? 'bg-purple-100 text-purple-800' :
                            member.proficiency_level === 'junior' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.proficiency_level === 'expert' ? 'Expert' :
                             member.proficiency_level === 'senior' ? 'Senior' :
                             member.proficiency_level === 'junior' ? 'Junior' :
                             'Standaard'}
                          </span>
                        </div>
                      )}
                      
                      {/* Rating */}
                      {member.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{member.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">
                            ({member.review_count || 0} reviews)
                          </span>
                        </div>
                      )}

                      {/* Bio */}
                      {member.bio && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {member.bio}
                        </p>
                      )}

                      {/* Specializations */}
                      {member.specializations && member.specializations.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {member.specializations.slice(0, 3).map((spec, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="mt-4 flex justify-end">
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}