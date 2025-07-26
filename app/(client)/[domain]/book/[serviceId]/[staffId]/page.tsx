'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffRedirectPage({
  params
}: {
  params: Promise<{ domain: string; serviceId: string; staffId: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to time selection page with staff ID in query params
    router.replace(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}/time?staff=${resolvedParams.staffId}`);
  }, [router, resolvedParams]);

  return (
    <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#7091D9] mx-auto"></div>
      </div>
    </div>
  );
}