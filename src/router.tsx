import { createBrowserRouter, type RouteObject } from 'react-router'
import ProtectedRoute from '@src/auth/ProtectedRoute'
import HomeRoute from '@src/routes/HomeRoute'
import OAuthCallbackRoute from '@src/routes/OAuthCallbackRoute'
import SignInRoute from '@src/routes/SignInRoute'
import App from './App'

export const routes = [
  {
    path: '/',
    Component: App,
    children: [
      {
        path: 'sign-in',
        Component: SignInRoute,
      },
      {
        path: 'auth/callback',
        Component: OAuthCallbackRoute,
      },
      {
        Component: ProtectedRoute,
        children: [
          {
            index: true,
            Component: HomeRoute,
          },
        ],
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export default router
