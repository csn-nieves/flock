# Flock technical foundation

## Status

Accepted as the starting architecture. Revisit a decision only when product evidence or a concrete technical constraint requires it.

## Application

- **React with TypeScript** for the interface.
- **Vite** for local development and production builds.
- **React Router** for client-side routes and shareable flock invitation URLs.
- **npm** for package management, with the lockfile committed to keep installations reproducible.

Flock will begin as a single-page application. Server-side rendering is not required for the private membership flow, and avoiding it keeps the first implementation smaller.

## Progressive web app

- Use **vite-plugin-pwa** to generate the web app manifest and service worker.
- Support installation on mobile home screens from the first release.
- Cache the application shell and essential static assets.
- Do not support offline data changes initially. Membership actions require a network connection and must show a clear connection error when unavailable.
- Prompt people before activating an update that would reload an open screen.

## Backend and data

Use **Supabase** for:

- PostgreSQL data storage
- Authentication
- Realtime features when chat is introduced
- File storage when flock images are introduced
- Edge Functions only when an operation requires secrets or privileged server-side behavior

The browser may use the Supabase client directly for permitted operations. Every user-owned or flock-owned table must have Row Level Security enabled and tested before it is used by the application. Service-role credentials and other secrets must never be included in the client bundle.

## Authentication

Use **Supabase Auth** for:

- Google sign-in
- Facebook sign-in
- Email sign-in

The exact email experience—password, magic link, or one-time code—will be selected in the authentication branch before implementation. OAuth provider setup and redirect URLs must support both local development and the production domain.

## Interface and styling

- Use semantic HTML and accessible native controls whenever they meet the interaction requirements.
- Use CSS custom properties as the source of truth for design tokens.
- Use **Tailwind CSS** for component and layout styling, mapped to the semantic CSS custom properties.
- Keep one small global stylesheet for tokens, resets, and application-wide behavior. Add component CSS only when a behavior cannot be expressed clearly with shared Tailwind utilities.
- Do not add a component library or global state library until repeated product needs justify one.
- Target WCAG 2.2 AA and phone layouts first, beginning at a 360-pixel viewport width.

The approved visual foundation uses shamrock `#369f60` as the primary color, deep navy typography, a restrained warm coral accent, and a true-white background.

## Testing and quality

- TypeScript strict mode
- ESLint and Prettier
- Vitest and React Testing Library for component and behavior tests
- Playwright for critical end-to-end flows once the first complete flow exists
- Production build and mobile browser verification before each branch is considered complete

## Hosting

Deploy the compiled Vite application to **Cloudflare Pages** from the GitHub repository.

- Production deploys come from `main`.
- Pull requests receive preview deployments.
- Supabase remains the backend; Cloudflare serves the application assets.
- Environment-specific public Supabase configuration is supplied through deployment environment variables.

This keeps initial hosting costs low and leaves Cloudflare Workers available if a small server-side endpoint is needed later.

## Deferred decisions

Do not select these until the corresponding feature branch begins:

- Map and route provider
- Email delivery provider
- Analytics and error monitoring
- Push notification provider
- Payment provider and subscription model

## References

- [Vite documentation](https://vite.dev/guide/)
- [Vite PWA documentation](https://vite-pwa-org.netlify.app/guide/)
- [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- [Supabase Realtime documentation](https://supabase.com/docs/guides/realtime)
- [Cloudflare Pages React documentation](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)
