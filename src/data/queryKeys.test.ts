import { describe, expect, it } from 'vitest'
import { flockQueryKeys } from '@src/data/queryKeys'

describe('flockQueryKeys', () => {
  it('keeps list and detail keys under the same flock root', () => {
    expect(flockQueryKeys.all).toEqual(['flocks'])
    expect(flockQueryKeys.lists()).toEqual(['flocks', 'list'])
    expect(flockQueryKeys.details()).toEqual(['flocks', 'detail'])
    expect(flockQueryKeys.detail('morning-runners')).toEqual([
      'flocks',
      'detail',
      'morning-runners',
    ])
  })
})
