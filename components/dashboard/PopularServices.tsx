import { ChevronDown } from 'lucide-react'

interface Service {
  name: string
  percentage: number
}

const services: Service[] = [
  { name: 'Lorem ipsum', percentage: 42 },
  { name: 'Lorem ipsum', percentage: 38 },
  { name: 'Lorem ipsum', percentage: 27 },
  { name: 'Lorem ipsum', percentage: 18 },
  { name: 'Lorem ipsum', percentage: 5 }
]

export function PopularServices() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Populaire diensten</h2>
        
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            Deze maand
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {services.map((service, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {service.name}
              </span>
              <span className="text-sm text-gray-600">
                {service.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${service.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}