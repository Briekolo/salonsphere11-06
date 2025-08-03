'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { InventoryContent } from '@/components/inventory/InventoryContent'

export default function InventoryPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev)
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-sidebar">
        <TopBar onMobileSidebarToggle={toggleMobileSidebar} />
        <main className="flex-1 overflow-auto">
          <InventoryContent />
        </main>
      </div>
    </div>
  )
}