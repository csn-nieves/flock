import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initializeDemoWorkspace } from './demo'

const rpcMock = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({ supabase: { rpc: rpcMock } }))

describe('demo data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a concrete success value after initializing the workspace', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })

    await expect(initializeDemoWorkspace()).resolves.toBe(true)
    expect(rpcMock).toHaveBeenCalledWith('initialize_demo_workspace')
  })

  it('propagates initialization errors', async () => {
    const error = new Error('demo failed')
    rpcMock.mockResolvedValue({ data: null, error })

    await expect(initializeDemoWorkspace()).rejects.toBe(error)
  })
})
