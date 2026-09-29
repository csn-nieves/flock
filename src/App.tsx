import { Outlet } from 'react-router'
import UpdatePrompt from './components/UpdatePrompt'

function App() {
  return (
    <main
      id="app"
      className="relative mx-auto min-h-screen min-h-svh min-h-dvh w-full max-w-app bg-background pt-[max(var(--page-gutter),env(safe-area-inset-top))] pr-[max(var(--page-gutter),env(safe-area-inset-right))] pb-[max(var(--page-gutter),env(safe-area-inset-bottom))] pl-[max(var(--page-gutter),env(safe-area-inset-left))]"
      aria-label="Flock application"
    >
      <Outlet />
      <UpdatePrompt />
    </main>
  )
}

export default App
