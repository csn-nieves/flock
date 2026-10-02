import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import AdminPage from './AdminPage'

const flock = { id: 'flock-id', name: 'Morning Miles', owner_id: 'owner-id' }

describe('AdminPage', () => {
  it('shows global counts and confirms flock deletion', () => {
    const onDeleteFlock = vi.fn().mockResolvedValue(undefined)
    render(
      <AdminPage
        flocks={[flock]}
        isDeleting={false}
        onDeleteFlock={onDeleteFlock}
        users={[{ user_id: 'user-id', display_name: 'Alex Runner' }]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Flocks (1)' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Runners (1)' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('dialog', { name: 'Delete flock?' })).toBeVisible()
    expect(onDeleteFlock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep flock' }))
    expect(
      screen.queryByRole('dialog', { name: 'Delete flock?' }),
    ).not.toBeInTheDocument()
  })
})
