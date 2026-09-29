import { createBrowserRouter, type RouteObject } from 'react-router'
import App from './App'
import HomePage from './pages/HomePage'

export const routes = [
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: HomePage,
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export default router
