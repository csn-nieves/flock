import { useEffect, type ReactNode } from 'react'

import Button from '@src/primitives/Button'

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
          <Button
            aria-label="Close"
            className="min-w-touch px-2 text-2xl leading-none text-text-muted"
            onClick={onClose}
            variant="ghost"
          >
            ×
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
