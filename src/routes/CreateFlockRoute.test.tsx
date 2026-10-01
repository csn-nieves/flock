import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import CreateFlockRoute from './CreateFlockRoute'

const createFlockMutation = vi.hoisted(() => ({
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutate: vi.fn(),
}))

vi.mock('@src/hooks/useCreateFlock', () => ({
  useCreateFlock: () => createFlockMutation,
}))

const createdFlock: FlockSummary = {
  id: 'sunrise-striders-id',
  name: 'Sunrise Striders',
  owner_id: 'runner-id',
}

function renderCreateFlockRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/flocks',
        element: <p>Flock collection destination</p>,
      },
      {
        path: '/flocks/new',
        element: <CreateFlockRoute />,
      },
      {
        path: '/flocks/:flockId',
        element: <p>Created flock destination</p>,
      },
    ],
    {
      initialEntries: ['/flocks', '/flocks/new'],
      initialIndex: 1,
    },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('CreateFlockRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createFlockMutation.error = null
    createFlockMutation.isError = false
    createFlockMutation.isPending = false
  })

  it('sets route metadata and forwards a normalized name to the mutation', () => {
    renderCreateFlockRoute()

    expect(document.title).toBe('Create a flock — Flock')

    fireEvent.change(screen.getByRole('textbox', { name: 'Flock name' }), {
      target: { value: '  Sunrise Striders  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    expect(createFlockMutation.mutate).toHaveBeenCalledWith(
      { name: 'Sunrise Striders' },
      { onSuccess: expect.any(Function) },
    )
  })

  it('returns to the flock collection with an app-owned back action', async () => {
    const router = renderCreateFlockRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Back to your flocks' }))

    expect(
      await screen.findByText('Flock collection destination'),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks')
  })

  it('maps pending mutation state to stable, duplicate-safe form progress', () => {
    createFlockMutation.isPending = true
    renderCreateFlockRoute()

    const button = screen.getByRole('button', { name: 'Creating flock' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toBeDisabled()

    fireEvent.click(button)
    expect(createFlockMutation.mutate).not.toHaveBeenCalled()
  })

  it('presents a safe recoverable error without exposing transport details', () => {
    createFlockMutation.error = new Error('raw database failure')
    createFlockMutation.isError = true
    renderCreateFlockRoute()

    const input = screen.getByRole('textbox', { name: 'Flock name' })
    fireEvent.change(input, { target: { value: 'Sunrise Striders' } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not create your flock. Check your connection and try again.',
    )
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()
    expect(input).toHaveValue('Sunrise Striders')
    expect(screen.getByRole('button', { name: 'Create flock' })).toBeEnabled()
  })

  it('navigates to the returned flock after successful creation', async () => {
    const router = renderCreateFlockRoute()

    fireEvent.change(screen.getByRole('textbox', { name: 'Flock name' }), {
      target: { value: 'Sunrise Striders' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    const mutationOptions = createFlockMutation.mutate.mock.calls[0]?.[1]
    mutationOptions.onSuccess(createdFlock)

    expect(await screen.findByText('Created flock destination')).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks/sunrise-striders-id')

    await router.navigate(-1)
    expect(
      await screen.findByText('Flock collection destination'),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks')
  })
})
