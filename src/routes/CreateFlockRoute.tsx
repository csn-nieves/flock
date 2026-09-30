import { useEffect } from 'react'

import { useCreateFlock } from '@src/hooks/useCreateFlock'
import CreateFlockPage from '@src/pages/flocks/CreateFlockPage'

const creationError =
  'We could not create your flock. Check your connection and try again.'

function CreateFlockRoute() {
  const createFlockMutation = useCreateFlock()

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
      onCreate={(name) => createFlockMutation.mutate({ name })}
    />
  )
}

export default CreateFlockRoute
