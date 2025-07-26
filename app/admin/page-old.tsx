'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Calendar, 
  Euro, 
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalBookings: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingActions: number;
}

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    pendingActions: 0,
  });

  useEffect(() => {
    if (isAdmin && tenantId) {
      fetchAdminMetrics();
    }
  }, [isAdmin, tenantId]);

  const fetchAdminMetrics = async () => {
    if (!tenantId) return;

    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Fetch active users (logged in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Fetch total bookings this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('start_time', startOfMonth.toISOString());

      // Fetch total revenue
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Fetch low stock items
      const { count: lowStockItems } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lt('quantity', 10);

      setMetrics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalBookings: totalBookings || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents
        lowStockItems: lowStockItems || 0,
        pendingActions: (lowStockItems || 0) + 2, // Example pending actions
      });
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Totaal Gebruikers',
      value: metrics.totalUsers,
      description: `${metrics.activeUsers} actief laatste 30 dagen`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Afspraken Deze Maand',
      value: metrics.totalBookings,
      description: 'Totaal geboekte afspraken',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Totale Omzet',
      value: `€${metrics.totalRevenue.toFixed(2)}`,
      description: 'Alle tijd omzet',
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Lage Voorraad',
      value: metrics.lowStockItems,
      description: 'Items onder minimum voorraad',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    { title: 'Nieuwe Medewerker', href: '/admin/staff/new', icon: Users },
    { title: 'Factuur Maken', href: '/admin/billing/new', icon: Euro },
    { title: 'Instellingen', href: '/admin/settings', icon: AlertCircle },
  ];

  const recentActivity = [
    { type: 'success', message: 'Backup succesvol voltooid', time: '2 uur geleden' },
    { type: 'warning', message: '5 producten hebben lage voorraad', time: '4 uur geleden' },
    { type: 'info', message: 'Nieuwe medewerker toegevoegd', time: '1 dag geleden' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Beheer uw salon instellingen en configuraties
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
            <CardDescription>
              Veelgebruikte admin taken
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recente Activiteit</CardTitle>
            <CardDescription>
              Laatste systeem gebeurtenissen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                {activity.type === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                {activity.type === 'warning' && (
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                )}
                {activity.type === 'info' && (
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions Alert */}
      {metrics.pendingActions > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              {metrics.pendingActions} Acties Vereist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Er zijn {metrics.pendingActions} items die uw aandacht vereisen. 
              Controleer lage voorraad items en systeem meldingen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}