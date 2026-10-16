import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getImageUrl } from './media'

const mocks = vi.hoisted(() => ({
  auth: { getSession: vi.fn() },
  storage: { from: vi.fn() },
}))

vi.mock('./supabase', () => ({ supabase: mocks }))

describe('media data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.getSession.mockResolvedValue({ data: { session: null } })
  })

  it('returns a signed URL when the private object exists', async () => {
    mocks.storage.from.mockReturnValue({
      list: vi
        .fn()
        .mockResolvedValue({ data: [{ name: 'avatar' }], error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.test/avatar' },
        error: null,
      }),
    })

    await expect(getImageUrl('profiles/runner/avatar')).resolves.toBe(
      'https://example.test/avatar',
    )
  })

  it('uses curated static media for missing objects in an anonymous demo session', async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { is_anonymous: true } } },
    })
    mocks.storage.from.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })

    await expect(getImageUrl('flocks/demo-flock/cover')).resolves.toMatch(
      /^\/demo-media\/flock-runners-0[1-3]\.webp$/,
    )
  })

  it('keeps named demo runners on distinct portrait assets', async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { is_anonymous: true } } },
    })
    mocks.storage.from.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })

    await expect(
      getImageUrl('profiles/demo-companion/avatar', 'Jordan Rivera'),
    ).resolves.toBe('/demo-media/runner-portrait-02.webp')
  })

  it('keeps missing media empty for regular sessions', async () => {
    mocks.storage.from.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })

    await expect(getImageUrl('events/event/cover')).resolves.toBeNull()
  })
})
