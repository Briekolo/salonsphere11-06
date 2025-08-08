'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { Loader2, User, Mail, Phone, Shield, Calendar, Clock, Save } from 'lucide-react'

type DbUser = {
  id: string
  email: string | null
  role: string | null
  tenant_id: string | null
  first_name: string | null
  last_name: string | null
  phone?: string | null
  active?: boolean | null
  specializations?: string[] | null
  working_hours?: any
}

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const { tenantId, loading: tenantLoading } = useTenant()
  const [loading, setLoading] = useState(true)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' })

  useEffect(() => {
    let isActive = true
    async function load() {
      if (!authUser) { setLoading(false); return }
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!isActive) return
      if (!error && data) {
        setDbUser(data as DbUser)
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? ''
        })
      }
      setLoading(false)
    }
    load()
    return () => { isActive = false }
  }, [authUser])

  const initials = useMemo(() => {
    const base = (dbUser?.first_name || '') + ' ' + (dbUser?.last_name || '')
    const fallback = authUser?.email?.split('@')[0] || 'Gebruiker'
    const pick = (base.trim() || fallback)
      .split(' ')
      .map(s => s.charAt(0))
      .slice(0, 2)
      .join('')
    return pick.toUpperCase()
  }, [dbUser, authUser])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dbUser) return
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        name: `${form.first_name} ${form.last_name}`.trim()
      })
      .eq('id', dbUser.id)
    setSaving(false)
    if (!error) {
      setDbUser({ ...dbUser, ...form })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Log eerst in om je profiel te bekijken.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mijn Profiel</h1>
          <p className="text-gray-600 mt-2">Beheer je persoonlijke gegevens en instellingen</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: avatar and identity */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-base font-semibold text-primary-700">{initials}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {(dbUser?.first_name || '') + ' ' + (dbUser?.last_name || '') || (authUser.email || 'Gebruiker')}
                  </p>
                  <p className="text-sm text-gray-500">{authUser.email}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Shield className="w-4 h-4" />
                  <span>Rol: {dbUser?.role || 'onbekend'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="w-4 h-4" />
                  <span>Tenant: {dbUser?.tenant_id || '-'}</span>
                </div>
                {typeof dbUser?.active === 'boolean' && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>Status: {dbUser.active ? 'Actief' : 'Inactief'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: editable details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Persoonlijke gegevens</h2>
              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Voornaam</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.first_name}
                      onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Achternaam</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.last_name}
                      onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">E-mail</label>
                    <div className="flex items-center gap-2 text-gray-700 border rounded-md px-3 py-2 bg-gray-50">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{authUser.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Telefoon</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Read-only extras */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.isArray(dbUser?.specializations) && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Specialisaties</label>
                      <div className="text-gray-700 text-sm">
                        {dbUser!.specializations!.length ? dbUser!.specializations!.join(', ') : '—'}
                      </div>
                    </div>
                  )}
                  {dbUser?.working_hours && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Werkuren</label>
                      <div className="text-gray-700 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Overzicht beschikbaar in agenda-instellingen
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Mijn Profiel - SalonSphere',
}

