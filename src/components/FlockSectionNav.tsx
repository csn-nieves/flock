const baseSections = [
  { label: 'Overview', href: '#flock-overview' },
  { label: 'Members', href: '#flock-members' },
]

function FlockSectionNav() {
  const sections = [...baseSections, { label: 'Events', href: '#flock-events' }]

  return (
    <nav
      aria-label="Flock sections"
      className="mt-8 flex gap-1 overflow-x-auto border-b border-border pb-px"
    >
      {sections.map((section, index) => (
        <a
          className={`min-h-touch shrink-0 rounded-t-md px-3 py-2 text-sm font-bold ${index === 0 ? 'border-b-2 border-primary text-text' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}`}
          href={section.href}
          key={section.href}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}

export default FlockSectionNav
