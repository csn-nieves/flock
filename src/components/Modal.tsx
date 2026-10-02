import { useEffect, type ReactNode } from 'react'

type ModalProps = {
  children: ReactNode
  description: string
  onClose: () => void
  title: string
}

function Modal({ children, description, onClose, title }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      aria-describedby="modal-description"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-text/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-app rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="m-0 font-display text-xl font-bold text-text"
              id="modal-title"
            >
              {title}
            </h2>
            <p
              className="mt-1 mb-0 text-sm text-text-muted"
              id="modal-description"
            >
              {description}
            </p>
          </div>
          <button
            aria-label="Close"
            className="min-h-touch min-w-touch rounded-md text-2xl leading-none text-text-muted hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
