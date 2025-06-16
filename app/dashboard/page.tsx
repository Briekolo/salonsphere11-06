import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function DashboardPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-paper p-4 lg:p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}