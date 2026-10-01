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
      className="mx-auto w-full py-8 sm:py-12"
    >
      <PageBackButton label="Back to your flocks" onBack={onBack} />

      <header>
        <div className="mt-6 mb-8 flex items-center gap-3">
          <img
            alt=""
            className="size-12 shrink-0 rounded-lg"
            height="48"
            src="/icons/flock-mark.svg"
            width="48"
          />
          <span className="font-display text-xl font-bold tracking-[-0.02em] text-text">
            Flock
          </span>
        </div>

        <h1
          className="m-0 font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-text"
          id="create-flock-heading"
        >
          Create a flock
        </h1>
        <p className="mt-2 mb-0 max-w-sm leading-6 text-text-muted">
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
