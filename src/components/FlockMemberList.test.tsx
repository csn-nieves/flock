import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FlockMemberSummary } from '@src/types/flockMembers'
import FlockMemberList from './FlockMemberList'

const members: FlockMemberSummary[] = [
  {
    displayName: 'Local Organizer',
    location: 'Portland, Oregon',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner',
    userId: 'owner-id',
  },
  {
    displayName: 'Local Runner',
    location: null,
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
    expect(screen.getByText('Portland, Oregon')).toBeVisible()
    expect(screen.getByText('Owner')).toBeVisible()
    expect(screen.getByText('Local Runner')).toBeVisible()
    expect(screen.getByText('Member')).toBeVisible()
  })

  it('renders no list for an empty roster', () => {
    render(<FlockMemberList members={[]} />)

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('groups members and filters the roster by name or location', () => {
    render(<FlockMemberList members={members} />)

    expect(screen.getByRole('button', { name: 'Owners (1)' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Members (1)' })).toBeVisible()

    fireEvent.change(screen.getByRole('textbox', { name: 'Search members' }), {
      target: { value: 'Portland' },
    })

    expect(screen.getByText('Local Organizer')).toBeVisible()
    expect(screen.queryByText('Local Runner')).not.toBeInTheDocument()
  })
})
