'use client';

import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { AlertCircle } from 'lucide-react';

export default function BillingPage() {
  const { isAdmin, isLoading } = useRequireAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Facturatie</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Facturatie module tijdelijk niet beschikbaar
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Het facturatiesysteem wordt momenteel vernieuwd. 
                  Omzet wordt nu automatisch bijgehouden via afspraken en betalingen.
                </p>
                <p className="mt-2">
                  U kunt de omzetgegevens bekijken in het dashboard en de rapporten sectie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}