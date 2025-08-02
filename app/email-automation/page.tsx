import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { EmailAutomationContent } from '@/components/email-automation/EmailAutomationContent'

export default function EmailAutomationPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <EmailAutomationContent />
        </main>
      </div>
    </div>
  )
}