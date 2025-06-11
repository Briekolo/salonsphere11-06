import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'

export default function DashboardAnalyticsPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <AnalyticsDashboard />
        </main>
      </div>
    </div>
  )
}