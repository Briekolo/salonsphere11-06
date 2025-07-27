'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  User,
  Calendar,
  Star,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';
import { useBusinessInfo } from '@/lib/hooks/useBusinessInfo';
import { useBusinessHours } from '@/lib/hooks/useBusinessHours';
import Image from 'next/image';

interface ClientHeaderProps {
  domain: string;
}

export function ClientHeader({ domain }: ClientHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { tenant } = useTenant();
  const { data: businessInfo } = useBusinessInfo();
  const { isCurrentlyOpen, getNextOpeningTime } = useBusinessHours();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Use business hours hook for more accurate open/closed status
  const isOpen = () => {
    return isCurrentlyOpen();
  };

  const navigation = [
    { name: 'Home', href: `/${domain}` },
    { name: 'Behandelingen', href: `/${domain}/services` },
    { name: 'Team', href: `/${domain}/team` },
    { name: 'Gallery', href: `/${domain}/gallery` },
    { name: 'Reviews', href: `/${domain}/reviews` },
    { name: 'Contact', href: `/${domain}/contact` },
  ];

  const isActive = (href: string) => {
    if (href === `/${domain}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-6 text-sm">
              {tenant?.phone && (
                <a 
                  href={`tel:${tenant.phone}`} 
                  className="flex items-center gap-2 text-gray-600 hover:text-[#010009] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>{tenant.phone}</span>
                </a>
              )}
              {tenant?.address && (
                <div className="hidden md:flex items-center gap-2 text-gray-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-sm">
                    {tenant.address}{tenant.city ? `, ${tenant.city}` : ''}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                isOpen() 
                  ? 'bg-[#E5F6EE] text-[#059669]' 
                  : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOpen() ? 'bg-[#059669]' : 'bg-[#DC2626]'
                }`} />
                {isOpen() ? 'Nu geopend' : 'Gesloten'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 bg-white ${
        isScrolled 
          ? 'shadow-md' 
          : 'shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${domain}`} className="flex items-center gap-3">
              {tenant?.logo_url ? (
                <Image
                  src={tenant.logo_url}
                  alt={tenant.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-[#E3ECFB] rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#7091D9]" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-medium text-[#010009]" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                  {tenant?.name || 'Salon'}
                </h1>
                {tenant?.description && (
                  <p className="text-xs text-gray-600 hidden sm:block">{tenant.description.slice(0, 50)}...</p>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-[#010009] font-medium' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#010009]'
                  }`}
                  style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href={`/${domain}/account`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#010009] hover:bg-gray-100 rounded-lg transition-all duration-200"
                style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
              >
                <User className="h-4 w-4" />
                <span>Mijn account</span>
              </Link>
              <Link
                href={`/${domain}/book`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#02011F] text-white font-medium rounded-full hover:opacity-90 transition-all duration-200"
                style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
              >
                <Calendar className="h-4 w-4" />
                <span>Boek afspraak</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-[#010009] font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  href={`/${domain}/account`}
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>Mijn account</span>
                </Link>
                <Link
                  href={`/${domain}/book`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#02011F] text-white font-medium rounded-2xl hover:opacity-90 transition-all duration-200"
                  style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Boek afspraak</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}