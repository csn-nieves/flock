import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DiscoverPage from './DiscoverPage'

const runnerSearch = vi.hoisted(() => vi.fn())
const flockSearch = vi.hoisted(() => vi.fn())
vi.mock('@src/hooks/useDiscoverySearch', () => ({
  useRunnerSearch: runnerSearch,
  useFlockSearch: flockSearch,
}))

describe('DiscoverPage', () => {
  it('requires two characters before searching', () => {
    runnerSearch.mockReturnValue({ isPending: false, data: [] })
    flockSearch.mockReturnValue({ isPending: false, data: [] })
    render(<DiscoverPage />)
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    expect(
      screen.getByText('Enter at least two characters to search.'),
    ).toBeInTheDocument()
  })

  it('submits a term and renders runner and flock results', () => {
    runnerSearch.mockReturnValue({
      isPending: false,
      data: [{ user_id: 'runner-id', display_name: 'Alex Runner' }],
    })
    flockSearch.mockReturnValue({
      isPending: false,
      data: [{ id: 'flock-id', name: 'Morning Miles' }],
    })
    render(<DiscoverPage />)
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search runners and flocks' }),
      { target: { value: 'Alex' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByText('Alex Runner')).toBeInTheDocument()
    expect(screen.getByText('Morning Miles')).toBeInTheDocument()
  })
})
