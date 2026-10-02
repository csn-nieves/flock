function SettingsPage() {
  return (
    <section
      aria-labelledby="settings-heading"
      className="relative mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <header className="mt-6">
        <h1
          className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
          id="settings-heading"
        >
          Settings
        </h1>
        <p className="mt-2 mb-0 leading-6 text-text-muted">
          Manage how Flock looks and works for you.
        </p>
      </header>
      <section className="mt-8 rounded-lg border border-border bg-surface-subtle p-5">
        <h2 className="m-0 font-display text-lg font-bold text-text">
          Appearance
        </h2>
        <p className="mt-2 mb-0 leading-6 text-text-muted">
          Dark mode and other appearance controls are coming soon.
        </p>
      </section>
    </section>
  )
}

export default SettingsPage
