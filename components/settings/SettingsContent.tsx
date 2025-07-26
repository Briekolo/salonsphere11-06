'use client';

import { useIsAdmin } from '@/lib/hooks/use-admin';
import { Settings, Shield, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function SettingsContent() {
  const { isAdmin } = useIsAdmin();

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-gray-600">
          Beheer uw account en voorkeuren
        </p>
      </div>

      {isAdmin && (
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <h2 className="text-heading">Admin Instellingen</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Toegang tot uitgebreide salon beheer functies
          </p>
          <Link href="/admin/settings">
            <button className="btn-primary">
              <Settings className="mr-2 h-4 w-4" />
              Open Admin Instellingen
            </button>
          </Link>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary-600" />
          <h2 className="text-heading">Gebruiker Profiel</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Beheer uw persoonlijke gegevens
        </p>
        <p className="text-sm text-gray-500">
          Deze functionaliteit wordt binnenkort toegevoegd.
        </p>
      </div>

      <div className="card">
        <h2 className="text-heading mb-2">Voorkeuren</h2>
        <p className="text-gray-600 mb-4">
          Aanpassen van uw gebruikerservaring
        </p>
        <p className="text-sm text-gray-500">
          Deze functionaliteit wordt binnenkort toegevoegd.
        </p>
      </div>
    </div>
  );
}