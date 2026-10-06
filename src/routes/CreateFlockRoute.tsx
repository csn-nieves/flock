import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useCreateFlock } from '@src/hooks/useCreateFlock'
import CreateFlockPage from '@src/pages/flocks/CreateFlockPage'

const creationError =
  'We could not create your flock. Check your connection and try again.'

function CreateFlockRoute() {
  const createFlockMutation = useCreateFlock()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Create a flock — Flock'

    return () => {
      document.title = 'Flock'
    }
  }, [])

  return (
    <CreateFlockPage
      error={createFlockMutation.isError ? creationError : undefined}
      isCreating={createFlockMutation.isPending}
      onBack={() => navigate('/flocks', { replace: true })}
      onCreate={(input) =>
        createFlockMutation.mutate(input, {
          onSuccess: (flock) => {
            navigate(`/flocks/${encodeURIComponent(flock.id)}`, {
              replace: true,
            })
          },
        })
      }
    />
  )
}

export default CreateFlockRoute
