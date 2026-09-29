import { createBrowserRouter, type RouteObject } from 'react-router'
import ProtectedRoute from '@src/auth/ProtectedRoute'
import HomePage from '@src/pages/HomePage'
import SignInPage from '@src/pages/SignInPage'
import App from './App'

export const routes = [
  {
    path: '/',
    Component: App,
    children: [
      {
        path: 'sign-in',
        Component: SignInPage,
      },
      {
        Component: ProtectedRoute,
        children: [
          {
            index: true,
            Component: HomePage,
          },
        ],
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export default router
