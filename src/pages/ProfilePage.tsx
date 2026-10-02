import type { ReactNode } from 'react'

import ProfileForm from '@src/components/ProfileForm'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { Profile } from '@src/types/profile'

export type ProfilePageProps = {
  error?: string
  isSaving: boolean
  onBack: () => void
  onSave: (input: { displayName: string; location: string | null }) => void
  profile: Profile
  savedMessage?: string
}

type ProfilePageLayoutProps = {
  children?: ReactNode
  description: string
  heading: string
  onBack: () => void
}

function ProfilePageLayout({
  children,
  description,
  heading,
}: ProfilePageLayoutProps) {
  return (
    <section
      aria-labelledby="profile-heading"
      className="relative mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <header>
        <h1
          className="m-0 font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-text"
          id="profile-heading"
        >
          {heading}
        </h1>
        <p className="mt-6 mb-0 max-w-sm leading-6 text-text-muted">
          {description}
        </p>
      </header>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

function ProfilePage({
  error,
  isSaving,
  onBack,
  onSave,
  profile,
  savedMessage,
}: ProfilePageProps) {
  return (
    <ProfilePageLayout
      description="Choose the name and general location other runners will see in your flocks."
      heading="Your profile"
      onBack={onBack}
    >
      {savedMessage ? (
        <p
          className="mb-4 rounded-md border border-primary bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
          role="status"
        >
          {savedMessage}
        </p>
      ) : null}
      <ProfileForm
        error={error}
        initialDisplayName={profile.displayName}
        initialLocation={profile.location}
        isSubmitting={isSaving}
        onSubmit={onSave}
      />
    </ProfilePageLayout>
  )
}

export function ProfileLoadingPage({ onBack }: { onBack: () => void }) {
  return (
    <ProfilePageLayout
      description="Getting your profile ready."
      heading="Your profile"
      onBack={onBack}
    >
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Loading profile…</span>
      </div>
    </ProfilePageLayout>
  )
}

export function ProfileErrorPage({
  isRetrying,
  onBack,
  onRetry,
}: {
  isRetrying: boolean
  onBack: () => void
  onRetry: () => void
}) {
  return (
    <ProfilePageLayout
      description="We could not load your profile. Check your connection and try again."
      heading="Profile unavailable"
      onBack={onBack}
    >
      <div
        className="rounded-lg border border-accent bg-surface-subtle px-4 py-5"
        role="alert"
      >
        <span className="sr-only">
          We could not load your profile. Check your connection and try again.
        </span>
        <Button
          isPending={isRetrying}
          pendingLabel="Trying again"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    </ProfilePageLayout>
  )
}

export default ProfilePage
