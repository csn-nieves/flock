type PublicLegalPageProps = {
  kind: 'data-deletion' | 'privacy'
}

const supportEmail = 'csn.nieves@gmail.com'

function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary-strong">
          Flock
        </p>
        <h1 className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text sm:text-4xl">
          Privacy at Flock
        </h1>
        <p className="mt-3 mb-0 leading-6 text-text-muted">
          Flock helps run clubs organize group runs and stay connected. This
          page describes the information used to provide that service.
        </p>
      </header>

      <div className="space-y-8 leading-6 text-text">
        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            Information Flock uses
          </h2>
          <p className="mt-3 mb-0">
            Flock uses account information from email-code or Google sign-in,
            including your email address and authentication identifiers. You may
            also provide a display name, coarse city or region, and a profile
            photo.
          </p>
          <p className="mt-3 mb-0">
            When you use Flock, the service may store flock memberships, events,
            RSVPs, route data, messages, reactions, notification preferences,
            and the browser device subscription needed for opt-in push alerts.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            How Flock uses information
          </h2>
          <p className="mt-3 mb-0">
            Flock uses this information to authenticate you, show authorized
            flock and event content, deliver messages and optional alerts,
            protect private data, and operate the product.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            Service providers
          </h2>
          <p className="mt-3 mb-0">
            Flock relies on service providers for authentication, database and
            file storage, hosting, email delivery, route services, and browser
            push delivery. These providers receive only the information needed
            for the service they provide. Google sign-in is also subject to
            Google&apos;s policies.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            Your choices
          </h2>
          <p className="mt-3 mb-0">
            Profile details are optional where Flock marks them optional. You
            can turn off push alerts for a device in Settings. To ask about your
            information or request account and data deletion, contact{' '}
            <a
              className="font-semibold text-primary-strong underline underline-offset-2"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            Contact
          </h2>
          <p className="mt-3 mb-0">
            Questions about this page or Flock&apos;s information practices can
            be sent to{' '}
            <a
              className="font-semibold text-primary-strong underline underline-offset-2"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  )
}

function DataDeletionPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary-strong">
          Flock
        </p>
        <h1 className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text sm:text-4xl">
          Request data deletion
        </h1>
        <p className="mt-3 mb-0 leading-6 text-text-muted">
          Flock handles deletion requests by email while self-service account
          deletion is being developed.
        </p>
      </header>

      <div className="space-y-8 leading-6 text-text">
        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            How to request deletion
          </h2>
          <p className="mt-3 mb-0">
            Email{' '}
            <a
              className="font-semibold text-primary-strong underline underline-offset-2"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>{' '}
            from the address associated with your Flock account. Say that you
            want your Flock account and associated personal data deleted.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            What to include
          </h2>
          <p className="mt-3 mb-0">
            Include the email address used for Flock so the request can be
            matched to the right account. Never send your sign-in code,
            password, or other authentication secret by email.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl font-bold text-text">
            Review and confirmation
          </h2>
          <p className="mt-3 mb-0">
            Flock will verify the request, review the account and shared-data
            scope involved, and reply with the next steps. Some shared flock,
            event, or conversation records may need a separate review so that
            deleting one account does not unexpectedly remove information used
            by other runners.
          </p>
        </section>
      </div>
    </article>
  )
}

function PublicLegalPage({ kind }: PublicLegalPageProps) {
  return kind === 'privacy' ? <PrivacyPage /> : <DataDeletionPage />
}

export default PublicLegalPage
