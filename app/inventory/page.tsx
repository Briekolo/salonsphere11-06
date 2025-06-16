import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { InventoryContent } from '@/components/inventory/InventoryContent'

export default function InventoryPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <InventoryContent />
        </main>
      </div>
    </div>
  )
}