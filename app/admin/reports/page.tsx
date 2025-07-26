'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Euro,
  Users,
  TrendingUp,
  FileText,
  Filter
} from 'lucide-react';

interface ReportData {
  totalRevenue: number;
  totalAppointments: number;
  totalClients: number;
  avgRevenuePerClient: number;
  popularTreatments: Array<{name: string; count: number}>;
  monthlyRevenue: Array<{month: string; revenue: number}>;
}

export default function ReportsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // 30 days default

  useEffect(() => {
    if (tenantId) {
      fetchReportData();
    }
  }, [tenantId, dateRange]);

  const fetchReportData = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      // Fetch appointments for revenue calculation
      const { data: appointments } = await supabase
        .from('appointments')
        .select('total_price, service_name, client_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('created_at', daysAgo.toISOString());

      // Fetch unique clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.total_price || 0), 0) || 0;
      const totalAppointments = appointments?.length || 0;
      const avgRevenuePerClient = totalClients ? totalRevenue / totalClients : 0;

      // Calculate popular treatments
      const treatmentCounts: Record<string, number> = {};
      appointments?.forEach(apt => {
        if (apt.service_name) {
          treatmentCounts[apt.service_name] = (treatmentCounts[apt.service_name] || 0) + 1;
        }
      });

      const popularTreatments = Object.entries(treatmentCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReportData({
        totalRevenue,
        totalAppointments,
        totalClients: totalClients || 0,
        avgRevenuePerClient,
        popularTreatments,
        monthlyRevenue: [] // Placeholder for monthly data
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportContent = [
      'SALON RAPPORT',
      `Periode: Laatste ${dateRange} dagen`,
      `Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`,
      '',
      'OVERZICHT',
      `Totale Omzet: €${reportData.totalRevenue.toFixed(2)}`,
      `Totaal Afspraken: ${reportData.totalAppointments}`,
      `Totaal Klanten: ${reportData.totalClients}`,
      `Gemiddelde Omzet per Klant: €${reportData.avgRevenuePerClient.toFixed(2)}`,
      '',
      'POPULAIRE BEHANDELINGEN',
      ...reportData.popularTreatments.map((t, i) => `${i + 1}. ${t.name}: ${t.count} keer`),
    ].join('\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salon_rapport_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Totale Omzet',
      value: `€${reportData?.totalRevenue.toFixed(2) || '0.00'}`,
      icon: <Euro className="w-5 h-5" />,
      color: 'text-icon-green',
      bgColor: 'bg-icon-green-bg',
    },
    {
      title: 'Afspraken',
      value: reportData?.totalAppointments.toString() || '0',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-icon-blue',
      bgColor: 'bg-icon-blue-bg',
    },
    {
      title: 'Klanten',
      value: reportData?.totalClients.toString() || '0',
      icon: <Users className="w-5 h-5" />,
      color: 'text-icon-purple',
      bgColor: 'bg-icon-purple-bg',
    },
    {
      title: 'Gem. per Klant',
      value: `€${reportData?.avgRevenuePerClient.toFixed(2) || '0.00'}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-icon-orange',
      bgColor: 'bg-icon-orange-bg',
    },
  ];

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapporten</h1>
          <p className="text-gray-600 mt-2">
            Financiële en operationele rapporten
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7">Laatste 7 dagen</option>
              <option value="30">Laatste 30 dagen</option>
              <option value="90">Laatste 90 dagen</option>
              <option value="365">Laatste jaar</option>
            </select>
          </div>
          <button
            onClick={exportReport}
            className="btn-outlined"
          >
            <Download className="h-4 w-4" />
            Exporteren
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric) => (
          <div key={metric.title} className="metric-card">
            <div className="flex items-start justify-between">
              <div className={`metric-icon ${metric.bgColor}`}>
                <div className={metric.color}>{metric.icon}</div>
              </div>
            </div>
            <div className="mt-4">
              <p className="metric-title">{metric.title}</p>
              <p className="metric-value">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Popular Treatments */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-heading">Populaire Behandelingen</h2>
        </div>
        
        {reportData?.popularTreatments.length ? (
          <div className="space-y-3">
            {reportData.popularTreatments.map((treatment, index) => (
              <div key={treatment.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{treatment.name}</span>
                </div>
                <span className="text-sm text-gray-600">{treatment.count} keer</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Geen behandelingsdata beschikbaar voor deze periode
          </p>
        )}
      </div>

      {/* Export Options */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-heading">Export Opties</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={exportReport}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div>
              <span className="font-medium">Basis Rapport</span>
              <p className="text-sm text-gray-500">Omzet, afspraken en klant statistieken</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>
          
          <button
            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
            disabled
          >
            <div>
              <span className="font-medium">Uitgebreid Rapport</span>
              <p className="text-sm text-gray-500">Binnenkort beschikbaar</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}