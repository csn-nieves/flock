import { useEffect, useId, useRef, type ReactNode } from 'react'

import Button from '@src/primitives/Button'

type ModalProps = {
  children: ReactNode
  description: string
  onClose: () => void
  title: string
  size?: 'default' | 'wide'
  tone?: 'default' | 'danger'
}

function Modal({
  children,
  description,
  onClose,
  size = 'default',
  title,
  tone = 'default',
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [])

  const surfaceClasses = [
    'w-full max-w-app overflow-hidden rounded-t-2xl border border-border bg-background shadow-lg sm:rounded-2xl',
    size === 'wide' ? 'sm:max-w-3xl' : null,
    tone === 'danger' ? 'border-t-4 border-t-danger' : null,
  ]
    .filter(Boolean)
    .join(' ')
  const scrollAreaClasses =
    'modal-scroll-area max-h-[min(86svh,42rem)] overflow-y-auto px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:py-5'

  return (
    <div
      aria-describedby={descriptionId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-text/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div className={surfaceClasses}>
        <div className={scrollAreaClasses} data-modal-scroll-area>
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden"
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="m-0 font-display text-xl font-bold text-text"
                id={titleId}
              >
                {title}
              </h2>
              <p
                className="mt-1 mb-0 text-sm text-text-muted"
                id={descriptionId}
              >
                {description}
              </p>
            </div>
            <Button
              aria-label="Close dialog"
              className="min-w-touch px-2 text-2xl leading-none text-text-muted"
              onClick={onClose}
              ref={closeButtonRef}
              variant="ghost"
            >
              ×
            </Button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Modal
