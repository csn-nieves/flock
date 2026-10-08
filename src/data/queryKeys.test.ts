import { describe, expect, it } from 'vitest'
import { flockChatQueryKeys, flockQueryKeys } from '@src/data/queryKeys'

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

describe('flockChatQueryKeys', () => {
  it('separates the conversation list from flock message history', () => {
    expect(flockChatQueryKeys.lists()).toEqual(['flock-chat', 'list'])
    expect(flockChatQueryKeys.messages('morning-runners')).toEqual([
      'flock-chat',
      'morning-runners',
    ])
  })
})
