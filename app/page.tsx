import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default function DashboardPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-background">
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}