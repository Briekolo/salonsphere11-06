// Category color utilities voor pastel badges en kalender kleuren
export const CATEGORY_COLORS = {
  pink: { 
    bg: 'bg-pink-100', 
    text: 'text-pink-800',
    calendar: 'bg-pink-200 border-pink-300 text-pink-900'
  },
  purple: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800',
    calendar: 'bg-purple-200 border-purple-300 text-purple-900'
  },
  blue: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800',
    calendar: 'bg-blue-200 border-blue-300 text-blue-900'
  },
  green: { 
    bg: 'bg-green-100', 
    text: 'text-green-800',
    calendar: 'bg-green-200 border-green-300 text-green-900'
  },
  yellow: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800',
    calendar: 'bg-yellow-200 border-yellow-300 text-yellow-900'
  },
  red: { 
    bg: 'bg-red-100', 
    text: 'text-red-800',
    calendar: 'bg-red-200 border-red-300 text-red-900'
  },
  indigo: { 
    bg: 'bg-indigo-100', 
    text: 'text-indigo-800',
    calendar: 'bg-indigo-200 border-indigo-300 text-indigo-900'
  },
  teal: { 
    bg: 'bg-teal-100', 
    text: 'text-teal-800',
    calendar: 'bg-teal-200 border-teal-300 text-teal-900'
  },
  orange: { 
    bg: 'bg-orange-100', 
    text: 'text-orange-800',
    calendar: 'bg-orange-200 border-orange-300 text-orange-900'
  },
  slate: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-800',
    calendar: 'bg-slate-200 border-slate-300 text-slate-900'
  },
} as const

// Hash function om consistent kleuren te krijgen op basis van category ID
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function getCategoryColor(categoryId?: string | null): keyof typeof CATEGORY_COLORS {
  if (!categoryId) return 'slate'
  
  const colorKeys = Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]
  const hash = hashString(categoryId)
  return colorKeys[hash % colorKeys.length]
}

export function getCategoryBadgeClasses(categoryColor?: string | null): string {
  if (!categoryColor) {
    return 'bg-gray-100 text-gray-800'
  }
  
  // Handle hex colors
  if (categoryColor.startsWith('#')) {
    return 'text-white'
  }
  
  // Handle preset color names
  const colors = CATEGORY_COLORS[categoryColor as keyof typeof CATEGORY_COLORS]
  if (colors) {
    return `${colors.bg} ${colors.text}`
  }
  
  // Default fallback
  return 'bg-gray-100 text-gray-800'
}

export function getCategoryCalendarClasses(categoryId?: string | null): string {
  const colorKey = getCategoryColor(categoryId)
  const colors = CATEGORY_COLORS[colorKey]
  return colors.calendar
}