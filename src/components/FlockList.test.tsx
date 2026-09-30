import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import FlockList from './FlockList'

const flocks: FlockSummary[] = [
  {
    id: 'morning-runners-id',
    name: 'Morning Runners',
    owner_id: 'owner-id',
  },
  {
    id: 'weekend-miles-id',
    name: 'Weekend Miles',
    owner_id: 'another-owner-id',
  },
]

describe('FlockList', () => {
  it('renders each flock as an accessible selection', () => {
    render(<FlockList flocks={flocks} onSelect={vi.fn()} />)

    expect(screen.getByRole('list', { name: 'Your flocks' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Open Morning Runners' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Open Weekend Miles' }),
    ).toBeVisible()
  })

  it('reports the selected flock identifier', () => {
    const handleSelect = vi.fn()
    render(<FlockList flocks={flocks} onSelect={handleSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open Weekend Miles' }))

    expect(handleSelect).toHaveBeenCalledOnce()
    expect(handleSelect).toHaveBeenCalledWith('weekend-miles-id')
  })

  it('leaves empty-state presentation to the page', () => {
    render(<FlockList flocks={[]} onSelect={vi.fn()} />)

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
