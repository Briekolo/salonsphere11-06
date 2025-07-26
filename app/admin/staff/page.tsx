'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'staff';
  specializations: string[];
  working_hours: any;
  active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function StaffManagementPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const router = useRouter();
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchStaff();
    }
  }, [tenantId]);

  const fetchStaff = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStaff(data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Weet u zeker dat u deze medewerker wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId)
        .eq('tenant_id', tenantId);

      if (!error) {
        setStaff(staff.filter(s => s.id !== staffId));
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (member.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medewerkers</h1>
          <p className="text-gray-600 mt-2">
            Beheer uw team en hun toegangsrechten
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/staff/new')}
          className="btn-primary"
        >
          <UserPlus className="h-4 w-4" />
          Nieuwe Medewerker
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="metric-icon bg-icon-blue-bg">
              <div className="text-icon-blue"><Users className="h-5 w-5" /></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Totaal</p>
            <p className="metric-value">{staff.length}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="metric-icon bg-icon-green-bg">
              <div className="text-icon-green"><Shield className="h-5 w-5" /></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Admins</p>
            <p className="metric-value">{staff.filter(s => s.role === 'admin').length}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="metric-icon bg-icon-purple-bg">
              <div className="text-icon-purple"><Users className="h-5 w-5" /></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Medewerkers</p>
            <p className="metric-value">{staff.filter(s => s.role === 'staff').length}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="metric-icon bg-icon-orange-bg">
              <div className="text-icon-orange"><Clock className="h-5 w-5" /></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Actief Vandaag</p>
            <p className="metric-value">{staff.filter(s => s.active).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek op naam of email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Alle Rollen</option>
            <option value="admin">Admin</option>
            <option value="staff">Medewerker</option>
          </select>
        </div>
      </div>

      {/* Staff List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medewerker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Laatste Login
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name || 'Onbekend'}</div>
                        <div className="text-sm text-gray-500">Lid sinds {new Date(member.created_at).toLocaleDateString('nl-NL')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-900">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-chip ${
                      member.role === 'admin' 
                        ? 'bg-icon-purple-bg text-icon-purple' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <Shield className="h-3 w-3" />
                      {member.role === 'admin' ? 'Admin' : 'Medewerker'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-chip ${
                      member.active 
                        ? 'bg-icon-green-bg text-icon-green' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.active ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.last_login 
                      ? new Date(member.last_login).toLocaleString('nl-NL')
                      : 'Nog niet ingelogd'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === member.id ? null : member.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {showActionMenu === member.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <button
                            onClick={() => {
                              setShowActionMenu(null);
                              router.push(`/admin/staff/${member.id}/edit`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Edit className="h-4 w-4" />
                            Bewerken
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          >
                            <Trash2 className="h-4 w-4" />
                            Verwijderen
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Geen medewerkers gevonden</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Probeer een andere zoekopdracht.' : 'Voeg uw eerste medewerker toe.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Medewerker toegang</p>
            <p>Medewerkers krijgen automatisch een uitnodiging per email wanneer ze worden toegevoegd. Ze kunnen inloggen met hun email en wachtwoord.</p>
          </div>
        </div>
      </div>
    </div>
  );
}