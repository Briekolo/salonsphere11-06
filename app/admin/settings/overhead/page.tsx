import { OverheadSettings } from '@/components/admin/OverheadSettings'

export default function OverheadSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overhead Instellingen</h1>
        <p className="text-gray-600 mt-1">
          Configureer uw overhead kosten voor nauwkeurige behandelingsprijzen
        </p>
      </div>
      
      <OverheadSettings />
    </div>
  )
}