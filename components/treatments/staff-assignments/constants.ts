export type ViewType = 'staff' | 'service' | 'overview'

export const VIEW_OPTIONS = [
  { value: 'staff' as const, label: 'Per Medewerker', icon: 'User' },
  { value: 'service' as const, label: 'Per Behandeling', icon: 'Sparkles' },
  { value: 'overview' as const, label: 'Overzicht', icon: 'BarChart3' },
] as const