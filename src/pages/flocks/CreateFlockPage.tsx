import CreateFlockForm from '@src/components/CreateFlockForm'
import PageBackButton from '@src/components/PageBackButton'

export type CreateFlockPageProps = {
  isCreating: boolean
  onBack: () => void
  onCreate: (name: string) => void
  error?: string
}

function CreateFlockPage({
  error,
  isCreating,
  onBack,
  onCreate,
}: CreateFlockPageProps) {
  return (
    <section
      aria-labelledby="create-flock-heading"
      className="relative mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <PageBackButton label="Back to your flocks" onBack={onBack} />

      <header>
        <h1
          className="m-0 font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-text"
          id="create-flock-heading"
        >
          Create a flock
        </h1>
        <p className="mt-6 mb-0 max-w-sm leading-6 text-text-muted">
          Start with a name your runners will recognize.
        </p>
      </header>

      <div className="mt-8">
        <CreateFlockForm
          error={error}
          isSubmitting={isCreating}
          onSubmit={onCreate}
        />
      </div>
    </section>
  )
}

export default CreateFlockPage
