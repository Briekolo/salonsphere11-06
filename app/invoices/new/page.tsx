import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { NewInvoiceContent } from '@/components/invoices/NewInvoiceContent'

export default function NewInvoicePage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <NewInvoiceContent />
        </main>
      </div>
    </div>
  )
}