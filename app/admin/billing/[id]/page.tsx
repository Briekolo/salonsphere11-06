'use client';

import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useEffect } from 'react';

export default function InvoiceDetailPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace('/admin/billing');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Doorverwijzen...</p>
        </div>
      </div>
    );
  }

  return null;
}