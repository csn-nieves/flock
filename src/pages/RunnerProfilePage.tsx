import Button from '@src/primitives/Button'
import ProfileIcon from '@src/primitives/icons/ProfileIcon'
import type { Profile } from '@src/types/profile'

type RunnerProfilePageProps = {
  isCurrentUser: boolean
  onBack: () => void
  onMessage: () => void
  profile: Profile
}

function RunnerProfilePage({
  isCurrentUser,
  onBack,
  onMessage,
  profile,
}: RunnerProfilePageProps) {
  const initial =
    profile.displayName.trim().charAt(0).toLocaleUpperCase() || '?'

  return (
    <section
      aria-labelledby="runner-profile-heading"
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <button
        className="mb-6 min-h-touch rounded-md px-3 text-sm font-bold text-text-muted hover:bg-surface-subtle hover:text-text"
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          {profile.avatarUrl ? (
            <img
              alt={`${profile.displayName}'s profile photo`}
              className="size-28 rounded-full object-cover ring-4 ring-surface-subtle"
              src={profile.avatarUrl}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-28 items-center justify-center rounded-full bg-primary text-4xl font-bold text-on-primary ring-4 ring-surface-subtle"
            >
              {initial}
            </span>
          )}
          <h1
            className="mt-5 font-display text-3xl font-bold tracking-[-0.025em] text-text"
            id="runner-profile-heading"
          >
            {profile.displayName}
          </h1>
          {profile.location ? (
            <p className="mt-2 mb-0 text-text-muted">{profile.location}</p>
          ) : null}
        </div>
        <div className="mt-8 border-t border-border pt-6">
          {!isCurrentUser ? (
            <Button className="w-full" onClick={onMessage}>
              <ProfileIcon className="size-5" />
              Message {profile.displayName}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function RunnerProfileLoadingPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto w-full max-w-xl py-8 sm:py-12">
      <button
        className="mb-6 min-h-touch rounded-md px-3 text-sm font-bold text-text-muted hover:bg-surface-subtle hover:text-text"
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>
      <div
        className="rounded-xl border border-border bg-surface-subtle p-8 text-center text-text-muted"
        role="status"
      >
        Loading runner profile…
      </div>
    </section>
  )
}

export function RunnerProfileErrorPage({
  isRetrying,
  onBack,
  onRetry,
}: {
  isRetrying: boolean
  onBack: () => void
  onRetry: () => void
}) {
  return (
    <section className="mx-auto w-full max-w-xl py-8 sm:py-12">
      <button
        className="mb-6 min-h-touch rounded-md px-3 text-sm font-bold text-text-muted hover:bg-surface-subtle hover:text-text"
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>
      <div
        className="rounded-xl border border-danger/30 bg-danger/5 p-6"
        role="alert"
      >
        <h1 className="m-0 font-display text-xl font-bold text-text">
          Runner profile unavailable
        </h1>
        <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
          We could not load this runner profile. Check your connection and try
          again.
        </p>
        <Button
          className="mt-5"
          isPending={isRetrying}
          pendingLabel="Trying again"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    </section>
  )
}

export default RunnerProfilePage
