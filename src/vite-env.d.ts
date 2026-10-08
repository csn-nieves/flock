/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_WEB_PUSH_PUBLIC_KEY?: string
  readonly VITE_GEOAPIFY_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
