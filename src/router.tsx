import { createBrowserRouter, type RouteObject } from 'react-router'
import HomePage from '@src/pages/HomePage'
import App from './App'

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
