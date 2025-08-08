'use client';

import Link from 'next/link';
import { useTenant } from '@/lib/client/tenant-context';
import { usePathname } from 'next/navigation';

export function ClientFooter() {
  const { tenant, isLoading } = useTenant();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Extract domain from pathname
  const domain = pathname.split('/')[1] || '';

  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
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
      {/* Legal Links - Centered */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h4 className="font-semibold text-white mb-4 text-sm">Legaal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href={`/${domain}/terms`} className="hover:text-white transition-colors">
                  Algemene voorwaarden
                </Link>
              </li>
              <li>
                <Link href={`/${domain}/privacy`} className="hover:text-white transition-colors">
                  Gegevensbeschermingsbeleid
                </Link>
              </li>
              <li>
                <Link href={`/${domain}/cookies`} className="hover:text-white transition-colors">
                  Cookiebeleid
                </Link>
                <span className="text-gray-600 mx-2">|</span>
                <button 
                  onClick={() => {
                    // Cookie preferences modal would go here
                    alert('Cookie voorkeuren functie komt binnenkort');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Voorkeuren
                </button>
              </li>
              <li>
                <Link href={`/${domain}/content-policy`} className="hover:text-white transition-colors">
                  Inhoudsbeleid
                </Link>
              </li>
              <li>
                <Link href={`/${domain}/legal-notice`} className="hover:text-white transition-colors">
                  Juridische kennisgeving
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Divider line - full width */}
      <div className="border-t border-gray-800"></div>
      
      {/* Copyright - Centered */}
      <div className="py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © {currentYear} {tenant?.name || 'Salon'}. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
}