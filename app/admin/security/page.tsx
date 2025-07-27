'use client';

import { useState } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { 
  Shield, 
  Key, 
  Lock,
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react';

export default function SecurityPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(120); // minutes
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true
  });
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      alert('Beveiligingsinstellingen opgeslagen!');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Beveiliging</h1>
        <p className="text-gray-600 mt-2">
          Beheer toegang en beveiligingsinstellingen
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" />
          <h2 className="text-heading">Twee-Factor Authenticatie</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
          <div>
            <p className="font-medium">2FA Inschakelen</p>
            <p className="text-sm text-gray-600">Extra beveiligingslaag voor admin accounts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        
        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">2FA Actief</p>
                <p>Scan de QR code met uw authenticator app om 2FA in te stellen.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Policy */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5" />
          <h2 className="text-heading">Wachtwoord Beleid</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimale Lengte
            </label>
            <input
              type="number"
              value={passwordRequirements.minLength}
              onChange={(e) => setPasswordRequirements(prev => ({
                ...prev,
                minLength: parseInt(e.target.value) || 8
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="6"
              max="32"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <span className="text-sm">Hoofdletters vereist</span>
              <input
                type="checkbox"
                checked={passwordRequirements.requireUppercase}
                onChange={(e) => setPasswordRequirements(prev => ({
                  ...prev,
                  requireUppercase: e.target.checked
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <span className="text-sm">Cijfers vereist</span>
              <input
                type="checkbox"
                checked={passwordRequirements.requireNumbers}
                onChange={(e) => setPasswordRequirements(prev => ({
                  ...prev,
                  requireNumbers: e.target.checked
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <span className="text-sm">Symbolen vereist</span>
              <input
                type="checkbox"
                checked={passwordRequirements.requireSymbols}
                onChange={(e) => setPasswordRequirements(prev => ({
                  ...prev,
                  requireSymbols: e.target.checked
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5" />
          <h2 className="text-heading">Sessie Beheer</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sessie Timeout (minuten)
            </label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={30}>30 minuten</option>
              <option value={60}>1 uur</option>
              <option value={120}>2 uur</option>
              <option value={240}>4 uur</option>
              <option value={480}>8 uur</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Login Pogingen
            </label>
            <input
              type="number"
              value={loginAttempts}
              onChange={(e) => setLoginAttempts(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="3"
              max="10"
            />
            <p className="text-xs text-gray-500 mt-1">Account wordt tijdelijk geblokkeerd na dit aantal pogingen</p>
          </div>
        </div>
      </div>

      {/* API Security */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5" />
          <h2 className="text-heading">API Beveiliging</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Sleutel
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value="sk_live_abcd1234567890abcdef"
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button className="btn-outlined">
                Regenereren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h2 className="text-heading">Toegangscontrole</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">IP Whitelist</p>
              <p className="text-sm text-gray-600">Beperk toegang tot specifieke IP adressen</p>
            </div>
            <button className="btn-outlined text-sm">
              Configureren
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Audit Log</p>
              <p className="text-sm text-gray-600">Log alle admin acties voor controle</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Security Status */}
      <div className="card">
        <h2 className="text-heading mb-4">Beveiligingsstatus</h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">SSL Certificaat actief</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">Database encryptie ingeschakeld</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">Laatste security scan: 3 dagen geleden</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Wijzigingen Opslaan
            </>
          )}
        </button>
      </div>
    </div>
  );
}