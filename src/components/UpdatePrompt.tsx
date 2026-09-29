import { useRegisterSW } from 'virtual:pwa-register/react'

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
        <button
          className="min-h-touch cursor-pointer rounded-md border-0 bg-primary px-4 py-2 font-bold leading-5 text-on-primary transition-[color,background-color,transform] duration-fast ease-out hover:bg-primary-bright active:translate-y-px"
          type="button"
          onClick={() => void updateServiceWorker(true)}
        >
          Update now
        </button>
        <button
          className="min-h-touch cursor-pointer rounded-md border border-white/55 bg-transparent px-4 py-2 font-bold leading-5 text-background transition-[color,background-color,transform] duration-fast ease-out hover:bg-white/12 active:translate-y-px"
          type="button"
          onClick={() => setNeedsRefresh(false)}
        >
          Later
        </button>
      </div>
    </aside>
  )
}

export default UpdatePrompt
