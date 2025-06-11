import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { ClientsContent } from '@/components/clients/ClientsContent'

export default function ClientsPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <ClientsContent />
        </main>
      </div>
    </div>
  )
}