import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FlockSectionNav from './FlockSectionNav'

describe('FlockSectionNav', () => {
  it('renders the overview, members, and events anchors', () => {
    render(<FlockSectionNav />)
    expect(
      screen.getByRole('navigation', { name: 'Flock sections' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '#flock-overview',
    )
    expect(screen.getByRole('link', { name: 'Members' })).toHaveAttribute(
      'href',
      '#flock-members',
    )
    expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute(
      'href',
      '#flock-events',
    )
  })
})
