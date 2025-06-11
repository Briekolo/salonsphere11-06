import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { TreatmentsContent } from '@/components/treatments/TreatmentsContent'

export default function TreatmentsPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <TreatmentsContent />
        </main>
      </div>
    </div>
  )
}