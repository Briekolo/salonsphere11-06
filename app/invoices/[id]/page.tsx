import { use } from 'react';
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { InvoiceDetailContent } from '@/components/invoices/InvoiceDetailContent'

export default function InvoiceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <InvoiceDetailContent invoiceId={resolvedParams.id} />
        </main>
      </div>
    </div>
  )
}