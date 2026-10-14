import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RunnerProfilePage from './RunnerProfilePage'

describe('RunnerProfilePage', () => {
  it('shows public identity details and opens a direct message', () => {
    const onBack = vi.fn()
    const onMessage = vi.fn()

    render(
      <RunnerProfilePage
        isCurrentUser={false}
        onBack={onBack}
        onMessage={onMessage}
        profile={{
          avatarUrl: 'https://example.test/maya.jpg',
          displayName: 'Maya Chen',
          location: 'Brooklyn',
          updatedAt: '2026-10-03',
          userId: 'maya-id',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Maya Chen' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Brooklyn')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: "Maya Chen's profile photo" }),
    ).toHaveAttribute('src', 'https://example.test/maya.jpg')

    fireEvent.click(screen.getByRole('button', { name: 'Message Maya Chen' }))
    expect(onMessage).toHaveBeenCalledOnce()
  })

  it('does not offer a self-message action', () => {
    render(
      <RunnerProfilePage
        isCurrentUser
        onBack={vi.fn()}
        onMessage={vi.fn()}
        profile={{
          displayName: 'Avery Bennett',
          location: null,
          updatedAt: '2026-10-03',
          userId: 'avery-id',
        }}
      />,
    )

    expect(
      screen.queryByRole('button', { name: /Message/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
