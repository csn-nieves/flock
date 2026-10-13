import type { ReactNode } from 'react'

type AuthPageLayoutProps = {
  children?: ReactNode
  description: string
  heading: string
  isStatus?: boolean
  className?: string
}

function AuthPageLayout({
  children,
  description,
  heading,
  isStatus = false,
  className,
}: AuthPageLayoutProps) {
  const descriptionRole = isStatus ? 'status' : undefined

  return (
    <section
      aria-labelledby="auth-heading"
      className={[
        'mx-auto flex w-full max-w-sm flex-col py-8 sm:py-12',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="mb-8">
        <h1
          className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
          id="auth-heading"
        >
          {heading}
        </h1>
        <p
          className="mt-2 mb-0 max-w-xs leading-6 text-text-muted"
          role={descriptionRole}
        >
          {description}
        </p>
      </header>

      {children}
    </section>
  )
}

export default AuthPageLayout
