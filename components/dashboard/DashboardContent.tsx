import { MetricsCards } from './MetricsCards'
import { RevenueChart } from './RevenueChart'
import { AppointmentsList } from './AppointmentsList'
import { PopularServices } from './PopularServices'
import { InventoryStatus } from './InventoryStatus'

export function DashboardContent() {
  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Metrics Cards */}
      <MetricsCards />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 mobile-gap">
        {/* Revenue Chart - Full width on mobile, 8 columns on desktop */}
        <div className="lg:col-span-8">
          <RevenueChart />
        </div>
        
        {/* Appointments List - Full width on mobile, 4 columns on desktop */}
        <div className="lg:col-span-4">
          <AppointmentsList />
        </div>
        
        {/* Popular Services - Full width on mobile, 6 columns on desktop */}
        <div className="lg:col-span-6">
          <PopularServices />
        </div>
        
        {/* Inventory Status - Full width on mobile, 6 columns on desktop */}
        <div className="lg:col-span-6">
          <InventoryStatus />
        </div>
      </div>
    </div>
  )
}