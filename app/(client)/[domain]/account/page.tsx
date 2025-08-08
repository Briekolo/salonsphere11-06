'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuthContext } from '@/components/client/auth/ClientAuthProvider';
import { useTenant } from '@/lib/client/tenant-context';
import { 
  User, 
  Calendar, 
  LogOut, 
  ChevronRight,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function AccountDashboardPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { client, loading, isAuthenticated, logout } = useClientAuthContext();
  const { tenant } = useTenant();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/${resolvedParams.domain}/auth/login`);
    }
  }, [loading, isAuthenticated, router, resolvedParams.domain]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${resolvedParams.domain}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E3ECFB] rounded-xl mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#7091D9]" />
          </div>
          <p className="text-base text-gray-600">Account laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !client) {
    return null;
  }

  const menuItems = [
    {
      icon: User,
      title: 'Mijn profiel',
      description: 'Beheer uw persoonlijke gegevens',
      href: `/${resolvedParams.domain}/account/profile`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Calendar,
      title: 'Mijn afspraken',
      description: 'Bekijk uw afspraakgeschiedenis',
      href: `/${resolvedParams.domain}/account/bookings`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-[#010009] mb-2" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
              Welkom terug, {client.first_name}
            </h1>
            <p className="text-gray-600">
              Beheer uw account en bekijk uw afspraken bij {tenant?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Uitloggen</span>
          </button>
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Contactgegevens</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{client.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white rounded-xl p-6 hover:shadow-md transition-all duration-200 group"
            style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${item.bgColor} rounded-xl mb-4`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="text-lg font-medium text-[#010009] mb-1" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 mt-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-[#E3ECFB] rounded-xl p-6">
        <h2 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
          Snelle acties
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${resolvedParams.domain}/book`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#02011F] text-white font-medium rounded-xl hover:opacity-90 transition-all duration-200"
            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
          >
            <Calendar className="h-5 w-5" />
            <span>Nieuwe afspraak boeken</span>
          </Link>
          <Link
            href={`/${resolvedParams.domain}/contact`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#010009] font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
          >
            <Mail className="h-5 w-5" />
            <span>Contact opnemen</span>
          </Link>
        </div>
      </div>
    </div>
  );
}