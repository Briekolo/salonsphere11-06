'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { useUsers } from '@/lib/hooks/useUsers'
import { useServices } from '@/lib/hooks/useServices'
import { useActiveTreatmentCategories } from '@/lib/hooks/useTreatmentCategories'

interface AppointmentFiltersProps {
  onFiltersChange?: (filters: {
    searchTerm: string
    payment: string
    service: string
    staff: string
    category: string
  }) => void
}

export function AppointmentFilters({ onFiltersChange }: AppointmentFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  // Load staff members, services and categories dynamically
  const { data: users } = useUsers()
  const { data: services } = useServices()
  const { data: categories } = useActiveTreatmentCategories()
  
  // Filter for staff members only
  const staffMembers = users?.filter(user => user.role === 'staff') || []

  // Call onFiltersChange when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        searchTerm,
        payment: paymentFilter,
        service: serviceFilter,
        staff: staffFilter,
        category: categoryFilter
      })
    }
  }, [searchTerm, paymentFilter, serviceFilter, staffFilter, categoryFilter, onFiltersChange])

  return (
    <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
      {/* Search */}
      <div className="relative flex-1 lg:flex-none lg:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Zoek klant of behandeling..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
        />
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 lg:space-x-4">
        {/* Payment Filter */}
        <div className="relative">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full sm:w-auto"
          >
            <option value="all">Alle betalingen</option>
            <option value="paid">Betaald</option>
            <option value="unpaid">Niet betaald</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Staff Filter - Now Dynamic */}
        <div className="relative">
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full sm:w-auto"
          >
            <option value="all">Alle medewerkers</option>
            {staffMembers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.first_name} {staff.last_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full sm:w-auto"
          >
            <option value="all">Alle categorieën</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Service Filter - Now Dynamic */}
        <div className="relative">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full sm:w-auto"
          >
            <option value="all">Alle behandelingen</option>
            {services?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

      </div>
    </div>
  )
}