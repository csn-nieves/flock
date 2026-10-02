import type { ThemePreference } from '@src/theme/types'

type SettingsPageProps = {
  preference: ThemePreference
  onThemeChange: (preference: ThemePreference) => void
}

function getThemeLabel(option: 'system' | 'light' | 'dark') {
  if (option === 'dark') return 'Dark mode'
  if (option === 'light') return 'Light mode'
  return 'Use device setting'
}

function SettingsPage({ onThemeChange, preference }: SettingsPageProps) {
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
          Choose the palette that feels best for your run planning.
        </p>
        <fieldset className="mt-5 grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Color theme</legend>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <label
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm font-bold text-text hover:bg-surface-subtle"
              key={option}
            >
              <input
                checked={preference === option}
                className="size-4 accent-primary"
                name="theme"
                type="radio"
                value={option}
                onChange={() => onThemeChange(option)}
              />
              {getThemeLabel(option)}
            </label>
          ))}
        </fieldset>
      </section>
    </section>
  )
}

export default SettingsPage
