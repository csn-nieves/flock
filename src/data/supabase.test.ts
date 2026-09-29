import { afterEach, describe, expect, it, vi } from 'vitest'

function setValidEnvironment() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test-key')
}

describe('Supabase client', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('creates a browser client from public environment values', async () => {
    setValidEnvironment()

    const { supabase } = await import('./supabase')

    expect(supabase.auth).toBeDefined()
  })

  it('reports a missing project URL', async () => {
    setValidEnvironment()
    vi.stubEnv('VITE_SUPABASE_URL', ' ')

    await expect(import('./supabase')).rejects.toThrow(
      'Missing VITE_SUPABASE_URL',
    )
  })

  it('reports a missing publishable key', async () => {
    setValidEnvironment()
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')

    await expect(import('./supabase')).rejects.toThrow(
      'Missing VITE_SUPABASE_PUBLISHABLE_KEY',
    )
  })
})
