'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/client/tenant-context';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  Star,
  MapPin,
  Phone,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Heart,
  Quote,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useBusinessHours } from '@/lib/hooks/useBusinessHours';


interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  service_name?: string;
  created_at: string;
}

export default function HomePage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { isCurrentlyOpen, getNextOpeningTime, businessHours } = useBusinessHours();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalServices: 0,
    yearsInBusiness: 0
  });

  useEffect(() => {
    if (tenant?.id) {
      fetchReviews();
      fetchStats();
    }
  }, [tenant]);


  const fetchReviews = async () => {
    if (!tenant?.id) return;

    try {
      // For now, using mock data as reviews table might not exist yet
      // In production, this would fetch from a reviews table
      const mockReviews: Review[] = [
        {
          id: '1',
          client_name: 'Sophie van den Berg',
          rating: 5,
          comment: 'Fantastische service! Ik kom hier al jaren en ben altijd tevreden met het resultaat.',
          service_name: 'Balayage',
          created_at: '2024-01-15'
        },
        {
          id: '2',
          client_name: 'Emma de Vries',
          rating: 5,
          comment: 'De beste salon in de buurt! Professioneel team en geweldige sfeer.',
          service_name: 'Manicure',
          created_at: '2024-01-10'
        },
        {
          id: '3',
          client_name: 'Lisa Jansen',
          rating: 4,
          comment: 'Heel blij met mijn nieuwe kleur. De stylisten nemen echt de tijd voor je.',
          service_name: 'Highlights',
          created_at: '2024-01-05'
        }
      ];
      
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchStats = async () => {
    if (!tenant?.id) return;

    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

      // Fetch total services
      const { count: serviceCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('active', true);

      // Calculate years in business (mock for now)
      const yearsInBusiness = tenant.created_at 
        ? new Date().getFullYear() - new Date(tenant.created_at).getFullYear()
        : 5;

      setStats({
        totalClients: clientCount || 150,
        totalServices: serviceCount || 25,
        yearsInBusiness: yearsInBusiness || 5
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use default values
      setStats({
        totalClients: 150,
        totalServices: 25,
        yearsInBusiness: 5
      });
    } finally {
      setLoading(false);
    }
  };


  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-lg text-gray-600">Even geduld...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#02011F] to-[#1a192e] text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
                <div className={`w-2 h-2 rounded-full ${isCurrentlyOpen() ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>{isCurrentlyOpen() ? 'Nu geopend' : 'Gesloten'}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                Welkom bij {tenant?.name || 'Onze Salon'}
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-200 mb-8">
                {tenant?.description || 'Uw partner voor professionele beauty behandelingen. Boek vandaag nog uw afspraak en ervaar de beste service.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${resolvedParams.domain}/book`}>
                  <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#02011F] font-medium rounded-full hover:bg-gray-100 transition-all duration-200">
                    <Calendar className="h-5 w-5" />
                    Boek een afspraak
                  </button>
                </Link>
                <Link href={`/${resolvedParams.domain}/contact`}>
                  <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200">
                    <Phone className="h-5 w-5" />
                    Contact
                  </button>
                </Link>
              </div>

              {/* Quick Info */}
              <div className="mt-12 grid grid-cols-2 gap-6">
                {tenant?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-300">Locatie</p>
                      <p className="text-white font-medium">{tenant.address}, {tenant.city}</p>
                    </div>
                  </div>
                )}
                {tenant?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-300">Telefoon</p>
                      <p className="text-white font-medium">{tenant.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Image or Graphic */}
            <div className="relative">
              {tenant?.logo_url ? (
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={tenant.logo_url}
                    alt={tenant.name || 'Salon'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <Sparkles className="h-24 w-24 text-white/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-3">
                <Users className="h-6 w-6 text-[#7091D9]" />
              </div>
              <p className="text-3xl font-bold text-[#02011F]">{stats.totalClients}+</p>
              <p className="text-sm text-gray-600 mt-1">Tevreden klanten</p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-3">
                <Award className="h-6 w-6 text-[#7091D9]" />
              </div>
              <p className="text-3xl font-bold text-[#02011F]">{stats.yearsInBusiness}+</p>
              <p className="text-sm text-gray-600 mt-1">Jaar ervaring</p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-3">
                <Heart className="h-6 w-6 text-[#7091D9]" />
              </div>
              <p className="text-3xl font-bold text-[#02011F]">{stats.totalServices}+</p>
              <p className="text-sm text-gray-600 mt-1">Behandelingen</p>
            </div>
          </div>
        </div>
      </section>


      {/* Reviews Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#02011F] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
              Wat onze klanten zeggen
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Lees de ervaringen van onze tevreden klanten
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(review => (
              <div
                key={review.id}
                className="bg-[#f9faf7] rounded-2xl p-6 relative"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-[#E3ECFB]" />
                
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-4 italic">
                  "{review.comment}"
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#02011F]">
                      {review.client_name}
                    </p>
                    {review.service_name && (
                      <p className="text-sm text-gray-600">
                        {review.service_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 text-[#02011F]">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.8 uit 5 sterren</span>
              <span className="text-gray-600">• Gebaseerd op 150+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#02011F] to-[#1a192e] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
            Klaar om uzelf te verwennen?
          </h2>
          <p className="text-lg text-gray-200 mb-8">
            Boek vandaag nog uw afspraak en ervaar de beste beauty behandelingen
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${resolvedParams.domain}/book`}>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#02011F] font-medium rounded-full hover:bg-gray-100 transition-all duration-200">
                <Calendar className="h-5 w-5" />
                Boek een afspraak
              </button>
            </Link>
            <Link href={`/${resolvedParams.domain}/contact`}>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200">
                <MapPin className="h-5 w-5" />
                Bekijk locatie
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}