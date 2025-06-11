import { AlertTriangle, Package } from 'lucide-react'

interface LowStockItem {
  name: string
  quantity: number
  unit: string
}

interface RecentOrder {
  id: string
  supplier: string
  status: 'delivered' | 'in-transit'
  date: string
}

const lowStockItems: LowStockItem[] = [
  { name: 'L\'Oréal Professional Shampoo', quantity: 2, unit: 'stuks' },
  { name: 'Kerastase Haarmasker', quantity: 3, unit: 'stuks' },
  { name: 'Wella Color Touch', quantity: 1, unit: 'stuk' }
]

const recentOrders: RecentOrder[] = [
  {
    id: 'ORD-001',
    supplier: 'Redken Color Extend',
    status: 'delivered',
    date: 'Besteld op 10 mei'
  },
  {
    id: 'ORD-002', 
    supplier: 'Moroccanoil Treatment',
    status: 'in-transit',
    date: 'Besteld op 8 mei'
  },
  {
    id: 'ORD-003',
    supplier: 'Olaplex No. 3',
    status: 'delivered',
    date: 'Besteld op 5 mei'
  }
]

export function InventoryStatus() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Voorraadstatus</h2>
        <button className="text-sm text-primary-500 hover:text-primary-700">
          Beheer voorraad
        </button>
      </div>

      {/* Low Stock Alert */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-900">
            Producten bijna op
          </span>
        </div>
        
        <div className="space-y-2">
          {lowStockItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-primary-800">{item.name}</span>
              <span className="text-primary-600 font-medium">
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Recente bestellingen
        </h3>
        
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {order.supplier}
                </p>
                <p className="text-xs text-gray-600">
                  {order.date}
                </p>
              </div>
              
              <span className={`status-chip ${order.status === 'delivered' ? 'delivered' : 'in-transit'}`}>
                {order.status === 'delivered' ? 'Geleverd' : 'Onderweg'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full mt-6 btn-primary">
        Nieuwe bestelling
      </button>
    </div>
  )
}