import { spawnSync } from 'node:child_process'
import { createClient, type Session } from '@supabase/supabase-js'

type LocalSupabaseConfiguration = {
  API_URL: string
  PUBLISHABLE_KEY: string
  SECRET_KEY: string
}

function readLocalSupabaseConfiguration(): LocalSupabaseConfiguration {
  const result = spawnSync(
    'npx',
    ['--no-install', 'supabase', 'status', '--output', 'json'],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) {
    throw new Error(
      result.stderr || 'Unable to read the local Supabase configuration.',
    )
  }

  const configuration = JSON.parse(
    result.stdout,
  ) as Partial<LocalSupabaseConfiguration>
  if (
    !configuration.API_URL ||
    !configuration.PUBLISHABLE_KEY ||
    !configuration.SECRET_KEY
  ) {
    throw new Error('The local Supabase configuration is incomplete.')
  }

  return configuration as LocalSupabaseConfiguration
}

export async function createLocalSession(email: string): Promise<{
  session: Session
  storageKey: string
}> {
  const configuration = readLocalSupabaseConfiguration()
  const serverClient = createClient(
    configuration.API_URL,
    configuration.SECRET_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
  const { data: linkData, error: linkError } =
    await serverClient.auth.admin.generateLink({ email, type: 'magiclink' })
  if (linkError) throw linkError

  const publicClient = createClient(
    configuration.API_URL,
    configuration.PUBLISHABLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
  const { data: verificationData, error: verificationError } =
    await publicClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    })
  if (verificationError) throw verificationError
  if (!verificationData.session) {
    throw new Error(`Supabase did not create a session for ${email}.`)
  }

  const projectReference = new URL(configuration.API_URL).hostname.split('.')[0]
  return {
    session: verificationData.session,
    storageKey: `sb-${projectReference}-auth-token`,
  }
}
