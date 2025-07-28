import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const code = resolvedSearchParams.code
  const next = resolvedSearchParams.next ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(String(code))
    
    if (!error) {
      // Get the user to check if they have tenant_id in metadata
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.user_metadata?.tenant_id) {
        // User has completed onboarding, redirect to dashboard
        redirect('/')
      } else {
        // User needs to complete onboarding
        redirect('/onboarding')
      }
    }
  }

  // If no code or error occurred, redirect to sign in
  redirect('/auth/sign-in')
}