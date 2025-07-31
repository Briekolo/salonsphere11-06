'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useTenant } from '@/lib/client/tenant-context';

export function ClientFooter() {
  const { tenant, isLoading } = useTenant();

  // Helper function to format business hours
  const formatBusinessHours = () => {
    if (!tenant?.business_hours) {
      return [
        { day: 'Maandag', hours: '09:00 - 18:00' },
        { day: 'Dinsdag', hours: '09:00 - 18:00' },
        { day: 'Woensdag', hours: '09:00 - 18:00' },
        { day: 'Donderdag', hours: '09:00 - 20:00' },
        { day: 'Vrijdag', hours: '09:00 - 20:00' },
        { day: 'Zaterdag', hours: '09:00 - 17:00' },
        { day: 'Zondag', hours: 'Gesloten' },
      ];
    }

    const dayNames = {
      monday: 'Maandag',
      tuesday: 'Dinsdag', 
      wednesday: 'Woensdag',
      thursday: 'Donderdag',
      friday: 'Vrijdag',
      saturday: 'Zaterdag',
      sunday: 'Zondag'
    };

    return Object.entries(tenant.business_hours).map(([day, hours]) => ({
      day: dayNames[day as keyof typeof dayNames],
      hours: hours.closed ? 'Gesloten' : `${hours.open} - ${hours.close}`
    }));
  };

  const currentYear = new Date().getFullYear();
  const businessHours = formatBusinessHours();

  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">{tenant?.name || 'Salon'}</h3>
            <p className="text-gray-400 mb-4">
              {tenant?.description || 'Uw vertrouwde salon voor alle beauty behandelingen. Professioneel, persoonlijk en altijd de beste service.'}
            </p>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com/salon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/salon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Behandelingen
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-white transition-colors">
                  Ons Team
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-white transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-white transition-colors">
                  Afspraak maken
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-400">
              {(tenant?.address || tenant?.city) && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>
                    {tenant?.address || 'Hoofdstraat 123'}<br />
                    {tenant?.postal_code && `${tenant.postal_code} `}{tenant?.city || 'Amsterdam'}
                  </span>
                </li>
              )}
              {tenant?.phone && (
                <li>
                  <a 
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    {tenant.phone}
                  </a>
                </li>
              )}
              {tenant?.email && (
                <li>
                  <a 
                    href={`mailto:${tenant.email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    {tenant.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="font-semibold mb-4">Openingstijden</h4>
            <ul className="space-y-1 text-gray-400 text-sm">
              {businessHours.map((schedule) => (
                <li key={schedule.day} className="flex justify-between">
                  <span>{schedule.day}</span>
                  <span className={schedule.hours === 'Gesloten' ? 'text-gray-500' : ''}>
                    {schedule.hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© {currentYear} {tenant?.name || 'Salon'}. Alle rechten voorbehouden.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacybeleid
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Algemene voorwaarden
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}