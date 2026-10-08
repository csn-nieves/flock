import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { SavedRouteLibrary } from '@src/types/savedRoutes'
import SavedRouteLibraryDialog from './SavedRouteLibraryDialog'

vi.mock('./RouteMap', () => ({
  default: ({ route }: { route: { distanceMeters: number } }) => (
    <div>Map {route.distanceMeters}</div>
  ),
}))

const savedRoute = {
  createdAt: '2026-10-07T12:00:00Z',
  id: 'route-1',
  name: 'Riverside Loop',
  route: {
    coordinates: [
      [-74.01, 40.7],
      [-74, 40.71],
    ] as [number, number][],
    distanceMeters: 1609,
  },
  updatedAt: '2026-10-07T12:00:00Z',
}

function createLibrary(overrides: Partial<SavedRouteLibrary> = {}) {
  return {
    isDeleting: false,
    isLoading: false,
    isRenaming: false,
    isSaving: false,
    routes: [savedRoute],
    status: 'ready' as const,
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onRetry: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  }
}

describe('SavedRouteLibraryDialog', () => {
  it('previews and applies a saved route', () => {
    const onUseRoute = vi.fn()
    render(
      <SavedRouteLibraryDialog
        library={createLibrary()}
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={onUseRoute}
      />,
    )

    expect(screen.getByText('Map 1609')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Use this route' }))
    expect(onUseRoute).toHaveBeenCalledWith(savedRoute.route)
  })

  it('renames and confirms deletion without changing event copies', async () => {
    const library = createLibrary()
    render(
      <SavedRouteLibraryDialog
        library={library}
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }))
    fireEvent.change(screen.getByLabelText('Route name'), {
      target: { value: 'Morning Loop' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }))
    await waitFor(() =>
      expect(library.onRename).toHaveBeenCalledWith('route-1', 'Morning Loop'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(
      screen.getByText(
        'Delete this saved route? Events already using it will not change.',
      ),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Delete route' }))
    await waitFor(() =>
      expect(library.onDelete).toHaveBeenCalledWith('route-1'),
    )
  })

  it('shows loading, empty, and recoverable error states', () => {
    const { rerender } = render(
      <SavedRouteLibraryDialog
        library={createLibrary({ routes: [], status: 'loading' })}
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )
    expect(screen.getByText('Loading saved routes')).toBeVisible()

    rerender(
      <SavedRouteLibraryDialog
        library={createLibrary({ routes: [], status: 'error' })}
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )
    expect(
      screen.getByText('We could not load your saved routes.'),
    ).toBeVisible()

    rerender(
      <SavedRouteLibraryDialog
        library={createLibrary({ routes: [], status: 'ready' })}
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )
    expect(screen.getByText('No saved routes yet')).toBeVisible()
  })
})
