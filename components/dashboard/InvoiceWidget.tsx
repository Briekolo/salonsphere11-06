'use client';

import { useInvoiceStats } from '@/lib/hooks/useInvoices';
import { FileText, Euro, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function InvoiceWidget() {
  const { stats, loading } = useInvoiceStats();

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const overdueCount = stats.byStatus?.overdue || 0;
  const unpaidCount = (stats.byStatus?.sent || 0) + (stats.byStatus?.viewed || 0) + (stats.byStatus?.partially_paid || 0);

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[#010009]">Facturen Overzicht</h3>
        <FileText className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {/* Total Outstanding */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Openstaand bedrag</p>
          <div className="flex items-center gap-1">
            <Euro className="w-5 h-5 text-gray-600" />
            <p className="text-2xl font-medium text-[#010009]">
              {stats.outstandingAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Onbetaald</p>
            <p className="text-lg font-medium text-yellow-600">{unpaidCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Vervallen</p>
            <p className="text-lg font-medium text-red-600">{overdueCount}</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Deze maand ontvangen</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-center gap-1">
            <Euro className="w-4 h-4 text-gray-600" />
            <p className="text-lg font-medium text-green-600">
              {stats.paidAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <Link
            href="/invoices"
            className="w-full px-4 py-2 bg-[#02011F] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Bekijk alle facturen
          </Link>
          
          {overdueCount > 0 && (
            <Link
              href="/invoices?status=overdue"
              className="w-full mt-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {overdueCount} vervallen facturen
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}