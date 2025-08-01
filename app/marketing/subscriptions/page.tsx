import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { EmailAutomationSettings } from '@/components/marketing/EmailAutomationSettings'

export default function MarketingSubscriptionsPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <EmailAutomationSettings />
        </main>
      </div>
    </div>
  )
}