'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console for debugging
    console.error('Client module error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-medium text-[#010009] mb-2">
          Er is iets misgegaan
        </h1>
        
        <p className="text-gray-600 mb-6">
          {error.message === 'Salon not found' 
            ? 'Deze salon kon niet gevonden worden. Controleer de URL en probeer het opnieuw.'
            : 'Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#02011F] text-white rounded-lg hover:bg-[#010009] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Probeer opnieuw
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Naar startpagina
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-600">
              Error ID: {error.digest}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}