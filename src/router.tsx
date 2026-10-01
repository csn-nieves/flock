import { createBrowserRouter, type RouteObject } from 'react-router'
import ProtectedRoute from '@src/auth/ProtectedRoute'
import CreateFlockRoute from '@src/routes/CreateFlockRoute'
import FlockDetailRoute from '@src/routes/FlockDetailRoute'
import FlocksRoute from '@src/routes/FlocksRoute'
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
            Component: FlocksRoute,
          },
          {
            path: 'flocks',
            Component: FlocksRoute,
          },
          {
            path: 'flocks/new',
            Component: CreateFlockRoute,
          },
          {
            path: 'flocks/:flockId',
            Component: FlockDetailRoute,
          },
        ],
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export default router
