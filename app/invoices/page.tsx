import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { InvoicesContent } from '@/components/invoices/InvoicesContent'

export default function InvoicesPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <InvoicesContent />
        </main>
      </div>
    </div>
  )
}