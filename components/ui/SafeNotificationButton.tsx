'use client'

import { Bell } from 'lucide-react'

export function SafeNotificationButton() {
  return (
    <button className="flex p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] items-center justify-center relative">
      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
      {/* You can add a notification badge here later */}
    </button>
  )
}