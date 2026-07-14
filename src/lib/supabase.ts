import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client navigateur : @supabase/ssr = flow PKCE + storage cookie.
// Indispensable pour que signInWithOtp emette un lien ?code= et que la
// route serveur /auth/callback puisse exchangeCodeForSession (verifier en cookie).
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}
