import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import ProtectedRoute from '@src/auth/ProtectedRoute'
import RouteLoadingFallback from '@src/components/RouteLoadingFallback'
import FlocksRoute from '@src/routes/FlocksRoute'
import OAuthCallbackRoute from '@src/routes/OAuthCallbackRoute'
import SignInRoute from '@src/routes/SignInRoute'
import App from './App'

function lazyRoute(loadRoute: () => Promise<{ default: ComponentType }>) {
  return {
    HydrateFallback: RouteLoadingFallback,
    lazy: async () => {
      const route = await loadRoute()
      return { Component: route.default }
    },
  }
}

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
            path: 'profile',
            ...lazyRoute(() => import('@src/routes/ProfileRoute')),
          },
          {
            path: 'settings',
            ...lazyRoute(() => import('@src/routes/SettingsRoute')),
          },
          {
            path: 'events',
            ...lazyRoute(() => import('@src/routes/EventsRoute')),
          },
          {
            path: 'events/:eventId',
            ...lazyRoute(() => import('@src/routes/EventDetailRoute')),
          },
          {
            path: 'chats',
            ...lazyRoute(() => import('@src/routes/ChatsRoute')),
          },
          {
            path: 'chats/direct/new',
            ...lazyRoute(() => import('@src/routes/ChatsRoute')),
          },
          {
            path: 'chats/direct/:conversationId',
            ...lazyRoute(() => import('@src/routes/ChatsRoute')),
          },
          {
            path: 'chats/:flockId',
            ...lazyRoute(() => import('@src/routes/ChatsRoute')),
          },
          {
            path: 'discover',
            ...lazyRoute(() => import('@src/routes/DiscoverRoute')),
          },
          {
            path: 'admin',
            ...lazyRoute(() => import('@src/routes/AdminRoute')),
          },
          {
            path: 'event-invitations/:invitationToken',
            ...lazyRoute(
              () => import('@src/routes/AcceptEventInvitationRoute'),
            ),
          },
          {
            path: 'flocks/new',
            ...lazyRoute(() => import('@src/routes/CreateFlockRoute')),
          },
          {
            path: 'flocks/:flockId/invitations/new',
            ...lazyRoute(
              () => import('@src/routes/CreateFlockInvitationRoute'),
            ),
          },
          {
            path: 'flocks/:flockId',
            ...lazyRoute(() => import('@src/routes/FlockDetailRoute')),
          },
          {
            path: 'invitations/:invitationToken',
            ...lazyRoute(
              () => import('@src/routes/AcceptFlockInvitationRoute'),
            ),
          },
        ],
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export default router
