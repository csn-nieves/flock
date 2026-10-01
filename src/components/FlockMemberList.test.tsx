import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FlockMemberSummary } from '@src/types/flockMembers'
import FlockMemberList from './FlockMemberList'

const members: FlockMemberSummary[] = [
  {
    displayName: 'Local Organizer',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner',
    userId: 'owner-id',
  },
  {
    displayName: 'Local Runner',
    joinedAt: '2026-01-02T12:00:00.000Z',
    role: 'member',
    userId: 'runner-id',
  },
]

describe('FlockMemberList', () => {
  it('renders member identity and role with list semantics', () => {
    render(<FlockMemberList members={members} />)

    expect(screen.getByRole('list', { name: 'Flock members' })).toBeVisible()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Local Organizer')).toBeVisible()
    expect(screen.getByText('Owner')).toBeVisible()
    expect(screen.getByText('Local Runner')).toBeVisible()
    expect(screen.getByText('Member')).toBeVisible()
  })

  it('renders no list for an empty roster', () => {
    render(<FlockMemberList members={[]} />)

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
