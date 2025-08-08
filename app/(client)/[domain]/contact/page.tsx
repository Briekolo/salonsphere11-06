'use client';

import { use, useState } from 'react';
import { useTenant } from '@/lib/client/tenant-context';
import { useBusinessHours } from '@/lib/hooks/useBusinessHours';
import { 
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Globe,
  Loader2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { transformDbToFrontend } from '@/lib/utils/business-hours';

export default function ContactPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { businessHours, isCurrentlyOpen, getNextOpeningTime } = useBusinessHours();
  

  const formatBusinessHours = () => {
    if (!tenant?.business_hours) {
      return null;
    }

    // Transform database format (numeric keys) to frontend format (named keys)
    const transformedHours = transformDbToFrontend(tenant.business_hours);

    const daysOfWeek = [
      { key: 'monday', label: 'Maandag' },
      { key: 'tuesday', label: 'Dinsdag' },
      { key: 'wednesday', label: 'Woensdag' },
      { key: 'thursday', label: 'Donderdag' },
      { key: 'friday', label: 'Vrijdag' },
      { key: 'saturday', label: 'Zaterdag' },
      { key: 'sunday', label: 'Zondag' }
    ];

    return daysOfWeek.map(day => {
      const hours = transformedHours[day.key as keyof typeof transformedHours];
      
      if (!hours || hours.closed) {
        return {
          day: day.label,
          hours: 'Gesloten',
          isClosed: true
        };
      }

      return {
        day: day.label,
        hours: `${hours.open} - ${hours.close}`,
        isClosed: false
      };
    });
  };

  const getGoogleMapsUrl = () => {
    if (!tenant?.address || !tenant?.city) return '';
    const fullAddress = `${tenant.address}, ${tenant.postal_code || ''} ${tenant.city}, Netherlands`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  const getGoogleMapsEmbedUrl = () => {
    if (!tenant?.address || !tenant?.city) return '';
    const fullAddress = `${tenant.address}, ${tenant.postal_code || ''} ${tenant.city}, Netherlands`;
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(fullAddress)}`;
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-lg text-gray-600">Contactgegevens laden...</p>
        </div>
      </div>
    );
  }

  const formattedHours = formatBusinessHours();

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#02011F] to-[#1a192e] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
              Contact
            </h1>
            <p className="text-lg sm:text-xl text-gray-200">
              Neem contact met ons op voor vragen of om een afspraak te maken
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-4">
                <MapPin className="h-6 w-6 text-[#7091D9]" />
              </div>
              <h3 className="text-lg font-medium text-[#02011F] mb-2">Adres</h3>
              {tenant?.address ? (
                <>
                  <p className="text-gray-600 mb-3">
                    {tenant.address}<br />
                    {tenant.postal_code && `${tenant.postal_code} `}{tenant.city}
                  </p>
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#7091D9] hover:text-[#5a73b3] font-medium text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Bekijk op Google Maps
                  </a>
                </>
              ) : (
                <p className="text-gray-500">Geen adres beschikbaar</p>
              )}
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-4">
                <Phone className="h-6 w-6 text-[#7091D9]" />
              </div>
              <h3 className="text-lg font-medium text-[#02011F] mb-2">Telefoon</h3>
              {tenant?.phone ? (
                <>
                  <p className="text-gray-600 mb-3">{tenant.phone}</p>
                  <a
                    href={`tel:${tenant.phone}`}
                    className="inline-flex items-center gap-2 text-[#7091D9] hover:text-[#5a73b3] font-medium text-sm"
                  >
                    <Phone className="h-4 w-4" />
                    Bel ons nu
                  </a>
                </>
              ) : (
                <p className="text-gray-500">Geen telefoonnummer beschikbaar</p>
              )}
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E3ECFB] rounded-xl mb-4">
                <Mail className="h-6 w-6 text-[#7091D9]" />
              </div>
              <h3 className="text-lg font-medium text-[#02011F] mb-2">Email</h3>
              {tenant?.email ? (
                <>
                  <p className="text-gray-600 mb-3">{tenant.email}</p>
                  <a
                    href={`mailto:${tenant.email}`}
                    className="inline-flex items-center gap-2 text-[#7091D9] hover:text-[#5a73b3] font-medium text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Stuur een email
                  </a>
                </>
              ) : (
                <p className="text-gray-500">Geen email beschikbaar</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Hours & Map */}
            <div className="space-y-8">
              {/* Business Hours */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#02011F]" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    Openingstijden
                  </h2>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isCurrentlyOpen() 
                      ? 'bg-[#E5F6EE] text-[#059669]' 
                      : 'bg-[#FEE2E2] text-[#DC2626]'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isCurrentlyOpen() ? 'bg-[#059669]' : 'bg-[#DC2626]'
                    }`} />
                    {isCurrentlyOpen() ? 'Nu geopend' : 'Gesloten'}
                  </div>
                </div>

                {formattedHours && formattedHours.length > 0 ? (
                  <div className="space-y-3">
                    {formattedHours.map((day, index) => {
                      const isToday = new Date().getDay() === (index + 1) % 7;
                      return (
                        <div
                          key={day.day}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                            isToday ? 'bg-[#E3ECFB]' : ''
                          }`}
                        >
                          <span className={`${isToday ? 'font-medium text-[#02011F]' : 'text-gray-600'}`}>
                            {day.day}
                          </span>
                          <span className={`${
                            day.isClosed 
                              ? 'text-gray-400' 
                              : isToday 
                                ? 'font-medium text-[#02011F]' 
                                : 'text-gray-900'
                          }`}>
                            {day.hours}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Openingstijden niet beschikbaar</p>
                )}

                {!isCurrentlyOpen() && (
                  <div className="mt-4 p-3 bg-[#FEF3C7] rounded-lg">
                    <p className="text-sm text-[#92400E]">
                      We zijn momenteel gesloten
                    </p>
                  </div>
                )}
              </div>


              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Link href={`/${resolvedParams.domain}/book`}>
                  <button className="w-full bg-[#02011F] text-white font-medium py-3 px-4 rounded-full hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Boek afspraak
                  </button>
                </Link>
                {tenant?.phone && (
                  <a href={`tel:${tenant.phone}`}>
                    <button className="w-full bg-white border-2 border-[#02011F] text-[#02011F] font-medium py-3 px-4 rounded-full hover:bg-[#02011F] hover:text-white transition-all duration-200 flex items-center justify-center gap-2">
                      <Phone className="h-5 w-5" />
                      Bel ons
                    </button>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column - Additional Info */}
            <div className="space-y-8">
              {/* About Section */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#02011F] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                  Over {tenant?.name || 'Ons'}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {tenant?.description || 'Welkom bij onze salon, waar professionaliteit en persoonlijke aandacht samenkomen. Ons ervaren team staat klaar om u de beste beauty behandelingen te bieden in een ontspannen en luxe omgeving.'}
                </p>
              </div>

              {/* Services Preview */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-[#02011F] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                  Onze Specialiteiten
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7091D9] mt-2"></div>
                    <span>Professionele haarbehandelingen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7091D9] mt-2"></div>
                    <span>Gezichtsbehandelingen en huidverzorging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7091D9] mt-2"></div>
                    <span>Nagelverzorging en nail art</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7091D9] mt-2"></div>
                    <span>Massage en wellness behandelingen</span>
                  </li>
                </ul>
                <Link href={`/${resolvedParams.domain}/book`}>
                  <button className="mt-6 text-[#7091D9] hover:text-[#5a73b3] font-medium text-sm inline-flex items-center gap-2">
                    Bekijk alle behandelingen
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}