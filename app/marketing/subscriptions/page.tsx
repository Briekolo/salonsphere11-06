import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { CustomerSegmentation } from '@/components/marketing/CustomerSegmentation'

export default function MarketingSubscriptionsPage() {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <CustomerSegmentation />
        </main>
      </div>
    </div>
  )
}