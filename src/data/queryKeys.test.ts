import { describe, expect, it } from 'vitest'
import { flockQueryKeys } from '@src/data/queryKeys'

describe('flockQueryKeys', () => {
  it('keeps list, detail, and member keys under the same flock root', () => {
    expect(flockQueryKeys.all).toEqual(['flocks'])
    expect(flockQueryKeys.lists()).toEqual(['flocks', 'list'])
    expect(flockQueryKeys.details()).toEqual(['flocks', 'detail'])
    expect(flockQueryKeys.detail('morning-runners')).toEqual([
      'flocks',
      'detail',
      'morning-runners',
    ])
    expect(flockQueryKeys.memberLists()).toEqual(['flocks', 'members'])
    expect(flockQueryKeys.members('morning-runners')).toEqual([
      'flocks',
      'members',
      'morning-runners',
    ])
  })
})
