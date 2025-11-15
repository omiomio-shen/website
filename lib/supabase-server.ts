import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function getSupabaseServer(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  // Create a fresh client for each request - no caching
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'cache-control': 'no-cache'
      }
    }
  })
}

// Export a function instead of a singleton
export const supabaseServer = getSupabaseServer()
