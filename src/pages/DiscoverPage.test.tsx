import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DiscoverPage from './DiscoverPage'

const runnerSearch = vi.hoisted(() => vi.fn())
const flockSearch = vi.hoisted(() => vi.fn())
vi.mock('@src/hooks/useDiscoverySearch', () => ({
  useRunnerSearch: runnerSearch,
  useFlockSearch: flockSearch,
}))

describe('DiscoverPage', () => {
  const onSelectFlock = vi.fn()
  const onSelectRunner = vi.fn()

  function renderDiscoverPage() {
    return render(
      <DiscoverPage
        onSelectFlock={onSelectFlock}
        onSelectRunner={onSelectRunner}
      />,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires two characters before searching', () => {
    runnerSearch.mockReturnValue({ isPending: false, data: [] })
    flockSearch.mockReturnValue({ isPending: false, data: [] })
    renderDiscoverPage()
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    expect(
      screen.getByText('Enter at least two characters to search.'),
    ).toBeInTheDocument()
  })

  it('submits a term and renders runner and flock results', () => {
    runnerSearch.mockReturnValue({
      isPending: false,
      data: [
        {
          user_id: 'runner-id',
          display_name: 'Alex Runner',
          location: 'Brooklyn',
        },
      ],
    })
    flockSearch.mockReturnValue({
      isPending: false,
      data: [
        {
          description: 'Sunrise miles along the waterfront.',
          id: 'flock-id',
          location: 'Brooklyn',
          name: 'Morning Miles',
        },
      ],
    })
    renderDiscoverPage()
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search runners and flocks' }),
      { target: { value: 'Alex' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByText('Alex Runner')).toBeInTheDocument()
    expect(screen.getByText('Morning Miles')).toBeInTheDocument()
    expect(
      screen.getByText('Sunrise miles along the waterfront.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Brooklyn')).toHaveLength(2)
  })

  it('filters the visible result type', () => {
    runnerSearch.mockReturnValue({
      isPending: false,
      data: [{ user_id: 'runner-id', display_name: 'Alex Runner' }],
    })
    flockSearch.mockReturnValue({
      isPending: false,
      data: [{ id: 'flock-id', name: 'Morning Miles' }],
    })
    renderDiscoverPage()
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search runners and flocks' }),
      { target: { value: 'Morning' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    fireEvent.click(screen.getByRole('button', { name: 'Flocks' }))

    expect(
      screen.queryByRole('heading', { name: 'Runners' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Flocks' })).toBeInTheDocument()
  })

  it('forwards runner and flock selections', () => {
    runnerSearch.mockReturnValue({
      isPending: false,
      data: [{ user_id: 'runner-id', display_name: 'Alex Runner' }],
    })
    flockSearch.mockReturnValue({
      isPending: false,
      data: [{ id: 'flock-id', name: 'Morning Miles' }],
    })
    renderDiscoverPage()
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search runners and flocks' }),
      { target: { value: 'Alex' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open profile for Alex Runner',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open Morning Miles' }))

    expect(onSelectRunner).toHaveBeenCalledWith('runner-id')
    expect(onSelectFlock).toHaveBeenCalledWith('flock-id')
  })
})
