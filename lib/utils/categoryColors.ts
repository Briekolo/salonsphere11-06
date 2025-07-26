// Category color utilities voor pastel badges
export const CATEGORY_COLORS = {
  pink: { bg: 'bg-pink-100', text: 'text-pink-800' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
  green: { bg: 'bg-green-100', text: 'text-green-800' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  red: { bg: 'bg-red-100', text: 'text-red-800' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-800' },
} as const

export function getCategoryBadgeClasses(categoryColor?: string | null): string {
  // Debug logging
  console.log('Category color received:', categoryColor)
  
  if (!categoryColor || !CATEGORY_COLORS[categoryColor as keyof typeof CATEGORY_COLORS]) {
    // Default grijze badge als er geen kleur is
    console.log('Using default gray color')
    return 'bg-gray-100 text-gray-800'
  }
  
  const colors = CATEGORY_COLORS[categoryColor as keyof typeof CATEGORY_COLORS]
  console.log('Using colors:', colors)
  return `${colors.bg} ${colors.text}`
}