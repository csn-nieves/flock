import FlockDetailsForm from '@src/components/FlockDetailsForm'
import type { FlockDetailsInput } from '@src/types/flocks'

export type CreateFlockPageProps = {
  isCreating: boolean
  onBack: () => void
  onCreate: (input: FlockDetailsInput) => void
  error?: string
}

function CreateFlockPage({
  error,
  isCreating,
  onCreate,
}: CreateFlockPageProps) {
  return (
    <section
      aria-labelledby="create-flock-heading"
      className="relative mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <header>
        <h1
          className="m-0 font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-text"
          id="create-flock-heading"
        >
          Create a flock
        </h1>
        <p className="mt-6 mb-0 max-w-sm leading-6 text-text-muted">
          Add the details runners need to recognize your group.
        </p>
      </header>

      <div className="mt-8">
        <FlockDetailsForm
          error={error}
          isSubmitting={isCreating}
          mode="create"
          onSubmit={onCreate}
        />
      </div>
    </section>
  )
}

export default CreateFlockPage
