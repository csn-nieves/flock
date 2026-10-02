import { useRegisterSW } from 'virtual:pwa-register/react'

import Button from '@src/primitives/Button'

function UpdatePrompt() {
  const {
    needRefresh: [needsRefresh, setNeedsRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needsRefresh) {
    return null
  }

  return (
    <aside
      className="fixed right-[max(var(--page-gutter),env(safe-area-inset-right))] bottom-[max(var(--page-gutter),env(safe-area-inset-bottom))] left-[max(var(--page-gutter),env(safe-area-inset-left))] z-10 mx-auto grid max-w-[calc(var(--app-max-width)-(2*var(--page-gutter)))] gap-4 rounded-lg bg-text p-4 text-background shadow-floating sm:right-auto sm:left-1/2 sm:w-[calc(100%-2*var(--page-gutter))] sm:-translate-x-1/2"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="m-0 leading-6">A new version of Flock is ready.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-on-primary hover:bg-primary-bright"
          onClick={() => void updateServiceWorker(true)}
        >
          Update now
        </Button>
        <Button
          className="border-white/55 text-background hover:bg-white/12"
          onClick={() => setNeedsRefresh(false)}
          variant="ghost"
        >
          Later
        </Button>
      </div>
    </aside>
  )
}

export default UpdatePrompt
