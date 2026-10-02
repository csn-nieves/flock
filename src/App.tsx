import { Outlet } from 'react-router'
import UpdatePrompt from '@src/components/UpdatePrompt'

function App() {
  return (
    <main
      id="app"
      className="relative min-h-screen min-h-svh min-h-dvh w-full bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
      aria-label="Flock application"
    >
      <Outlet />
      <UpdatePrompt />
    </main>
  )
}

export default App
