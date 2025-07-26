import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent'

export default function AdminPage() {
  return (
    <div className="h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-gray-50">
          <AdminDashboardContent />
        </main>
      </div>
    </div>
  )
}