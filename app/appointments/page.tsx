import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { AgendaContent } from '@/components/agenda/AgendaContent'

export default function AppointmentsPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <AgendaContent />
        </main>
      </div>
    </div>
  )
}