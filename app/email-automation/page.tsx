'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { EmailAutomationContent } from '@/components/email-automation/EmailAutomationContent'

export default function EmailAutomationPage() {
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMobileSidebarToggle={toggleMobileSidebar} />
        <main className="flex-1 overflow-auto">
          <EmailAutomationContent />
        </main>
      </div>
    </div>
  )
}