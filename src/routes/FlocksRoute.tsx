import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import CreateFlockForm from '@src/components/CreateFlockForm'
import Modal from '@src/components/Modal'
import { useCreateFlock } from '@src/hooks/useCreateFlock'
import { useFlocks } from '@src/hooks/useFlocks'
import FlocksPage, {
  FlocksErrorPage,
  FlocksLoadingPage,
} from '@src/pages/flocks/FlocksPage'

const pageTitles = {
  error: 'Flocks unavailable — Flock',
  loading: 'Loading flocks… — Flock',
  success: 'Your flocks — Flock',
}

function CreateFlockDialog({ onClose }: { onClose: () => void }) {
  const createFlockMutation = useCreateFlock()
  const navigate = useNavigate()

  return (
    <Modal
      description="Start a group your runners will recognize."
      onClose={onClose}
      title="Create a flock"
    >
      <CreateFlockForm
        error={
          createFlockMutation.isError
            ? 'We could not create your flock. Check your connection and try again.'
            : undefined
        }
        isSubmitting={createFlockMutation.isPending}
        onSubmit={(name) =>
          createFlockMutation.mutate(
            { name },
            {
              onSuccess: (flock) => {
                onClose()
                navigate(`/flocks/${encodeURIComponent(flock.id)}`)
              },
            },
          )
        }
      />
    </Modal>
  )
}

function FlocksRoute() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const flocksQuery = useFlocks()
  const navigate = useNavigate()
  let status: keyof typeof pageTitles

  if (flocksQuery.isPending) {
    status = 'loading'
  } else if (flocksQuery.isError) {
    status = 'error'
  } else {
    status = 'success'
  }

  const title = pageTitles[status]

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (flocksQuery.isPending) {
    return <FlocksLoadingPage />
  }

  if (flocksQuery.isError) {
    return (
      <FlocksErrorPage
        isRetrying={flocksQuery.isFetching}
        onRetry={() => void flocksQuery.refetch()}
      />
    )
  }

  return (
    <>
      <FlocksPage
        flocks={flocksQuery.data}
        isRefreshing={flocksQuery.isFetching}
        onCreate={() => setIsCreateOpen(true)}
        onSelect={(flockId) =>
          navigate(`/flocks/${encodeURIComponent(flockId)}`)
        }
      />
      {isCreateOpen ? (
        <CreateFlockDialog onClose={() => setIsCreateOpen(false)} />
      ) : null}
    </>
  )
}

export default FlocksRoute
