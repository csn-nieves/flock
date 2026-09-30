import { createClient } from '@supabase/supabase-js'
import type { Database } from '@src/types/database'

function requireEnvironmentVariable(name: string, value: string | undefined) {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and add the public Supabase project value.`,
    )
  }

  return normalizedValue
}

const supabaseUrl = requireEnvironmentVariable(
  'VITE_SUPABASE_URL',
  import.meta.env.VITE_SUPABASE_URL,
)
const supabasePublishableKey = requireEnvironmentVariable(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
    },
  },
)
