import { useState } from 'react'
import Modal from '@src/components/Modal'
import Button from '@src/primitives/Button'
import type { AdminFlock, AdminUser } from '@src/data/admin'

type AdminPageProps = {
  flocks: readonly AdminFlock[]
  users: readonly AdminUser[]
  isDeleting: boolean
  onDeleteFlock: (flockId: string) => Promise<void>
}

function AdminPage({
  flocks,
  users,
  isDeleting,
  onDeleteFlock,
}: AdminPageProps) {
  const [deletingFlock, setDeletingFlock] = useState<AdminFlock | null>(null)

  return (
    <section
      aria-labelledby="admin-heading"
      className="mx-auto w-full max-w-4xl py-8 sm:py-12"
    >
      <h1
        className="m-0 font-display text-3xl font-bold text-text"
        id="admin-heading"
      >
        Admin
      </h1>
      <p className="mt-2 text-text-muted">
        Global flock and runner management.
      </p>
      <section aria-labelledby="admin-flocks-heading" className="mt-8">
        <h2
          className="font-display text-xl font-bold text-text"
          id="admin-flocks-heading"
        >
          Flocks ({flocks.length})
        </h2>
        <ul className="mt-3 grid gap-3">
          {flocks.map((flock) => (
            <li
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
              key={flock.id}
            >
              <div>
                <h3 className="m-0 font-display font-bold text-text">
                  {flock.name}
                </h3>
                <p className="mt-1 mb-0 text-sm text-text-muted">
                  Owner: {flock.owner_id}
                </p>
              </div>
              <Button variant="danger" onClick={() => setDeletingFlock(flock)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="admin-users-heading" className="mt-8">
        <h2
          className="font-display text-xl font-bold text-text"
          id="admin-users-heading"
        >
          Runners ({users.length})
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {users.map((user) => (
            <li
              className="rounded-md border border-border bg-surface-subtle px-4 py-3 text-text"
              key={user.user_id}
            >
              {user.display_name}
            </li>
          ))}
        </ul>
      </section>
      {deletingFlock ? (
        <Modal
          description={`This permanently removes “${deletingFlock.name}”, its memberships, and its events.`}
          onClose={() => setDeletingFlock(null)}
          title="Delete flock?"
          tone="danger"
        >
          <div className="grid gap-2 sm:flex sm:flex-row-reverse">
            <Button
              isPending={isDeleting}
              pendingLabel="Deleting flock"
              variant="danger"
              onClick={async () => {
                await onDeleteFlock(deletingFlock.id)
                setDeletingFlock(null)
              }}
            >
              Delete flock
            </Button>
            <Button variant="secondary" onClick={() => setDeletingFlock(null)}>
              Keep flock
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

export default AdminPage
