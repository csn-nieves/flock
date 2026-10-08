import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { SavedRouteLibrary } from '@src/types/savedRoutes'
import SaveRouteDialog from './SaveRouteDialog'

vi.mock('./RouteMap', () => ({ default: () => <div>Route preview</div> }))

const route = {
  coordinates: [
    [-74.01, 40.7],
    [-74, 40.71],
  ] as [number, number][],
  distanceMeters: 1609,
}

function createLibrary(overrides: Partial<SavedRouteLibrary> = {}) {
  return {
    isDeleting: false,
    isLoading: false,
    isRenaming: false,
    isSaving: false,
    routes: [],
    status: 'ready' as const,
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onRetry: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  }
}

describe('SaveRouteDialog', () => {
  it('requires a name and saves the current route', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const library = createLibrary()
    render(
      <SaveRouteDialog
        library={library}
        onClose={onClose}
        onSaved={onSaved}
        route={route}
        unit="mi"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save route' }))
    expect(screen.getByLabelText('Route name')).toHaveFocus()
    expect(screen.getByText('Enter a name for this route.')).toBeVisible()

    fireEvent.change(screen.getByLabelText('Route name'), {
      target: { value: '  Riverside Loop  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save route' }))

    await waitFor(() =>
      expect(library.onSave).toHaveBeenCalledWith('Riverside Loop', route),
    )
    expect(onSaved).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
  })
})
