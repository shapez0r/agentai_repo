import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null

export function getAuthRedirectUrl() {
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) {
    return import.meta.env.VITE_AUTH_REDIRECT_URL
  }

  if (typeof window === 'undefined') {
    return undefined
  }

  const redirectUrl = new URL(window.location.href)
  redirectUrl.hash = ''

  return redirectUrl.toString()
}
