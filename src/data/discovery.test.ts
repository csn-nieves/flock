import { beforeEach, describe, expect, it, vi } from 'vitest'

import { searchFlocks, searchRunners } from './discovery'

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock('./supabase', () => ({ supabase: { rpc: rpcMock } }))

describe('discovery data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('searches runners through the typed RPC', async () => {
    const results = [{ user_id: 'runner-id', display_name: 'Alex Runner' }]
    rpcMock.mockResolvedValue({ data: results, error: null })

    await expect(searchRunners('Alex')).resolves.toEqual(results)
    expect(rpcMock).toHaveBeenCalledWith('search_runners', {
      location_term: '',
      search_term: 'Alex',
    })
  })

  it('searches flocks through the typed RPC', async () => {
    const results = [
      { id: 'flock-id', name: 'Morning Miles', owner_id: 'owner-id' },
    ]
    rpcMock.mockResolvedValue({ data: results, error: null })

    await expect(searchFlocks('Morning')).resolves.toEqual(results)
    expect(rpcMock).toHaveBeenCalledWith('search_flocks', {
      location_term: '',
      search_term: 'Morning',
    })
  })

  it('propagates RPC errors', async () => {
    const error = new Error('Search unavailable')
    rpcMock.mockResolvedValue({ data: null, error })

    await expect(searchRunners('Alex')).rejects.toBe(error)
  })

  it('passes an optional location filter to the runner RPC', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })

    await searchRunners('Alex', 'Brooklyn')

    expect(rpcMock).toHaveBeenCalledWith('search_runners', {
      location_term: 'Brooklyn',
      search_term: 'Alex',
    })
  })
})
