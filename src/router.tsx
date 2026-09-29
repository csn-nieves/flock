import { createBrowserRouter, type RouteObject } from 'react-router'
import HomePage from '@src/pages/HomePage'
import SignInPage from '@src/pages/SignInPage'
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
      {
        path: 'sign-in',
        Component: SignInPage,
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export default router
