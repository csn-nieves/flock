import { forwardRef, type ComponentProps } from 'react'

import PendingIndicator from './PendingIndicator'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonControlSize = 'default' | 'icon'

type ButtonPendingProps =
  | {
      isPending: boolean
      pendingLabel: string
    }
  | {
      isPending?: never
      pendingLabel?: never
    }

export type ButtonProps = ComponentProps<'button'> &
  ButtonPendingProps & {
    controlSize?: ButtonControlSize
    variant?: ButtonVariant
  }

const baseClasses =
  'inline-flex min-h-touch cursor-pointer select-none items-center justify-center gap-2 rounded-md font-display text-[0.9375rem] font-bold leading-5 tracking-[-0.01em] transition-[color,background-color,border-color,transform] duration-fast ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0'

const controlSizeClasses: Record<ButtonControlSize, string> = {
  default: 'px-4 py-2',
  icon: 'size-12 shrink-0 p-0',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-primary text-on-primary hover:bg-primary-bright active:bg-primary-strong active:text-on-primary disabled:bg-primary disabled:text-on-primary',
  secondary:
    'border border-border bg-background text-text hover:bg-surface-subtle active:border-text active:bg-surface-subtle disabled:border-border disabled:bg-background disabled:text-text',
  danger:
    'border border-transparent bg-danger text-on-danger hover:bg-danger-bright active:bg-danger-strong active:text-on-danger disabled:bg-danger disabled:text-on-danger',
  ghost:
    'border border-transparent bg-transparent text-text hover:bg-surface-subtle active:bg-surface-subtle disabled:bg-transparent disabled:text-text-muted',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    'aria-label': ariaLabel,
    children,
    className,
    controlSize = 'default',
    disabled = false,
    isPending = false,
    onClick,
    pendingLabel,
    type = 'button',
    variant = 'primary',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isPending
  const classes = [
    baseClasses,
    controlSizeClasses[controlSize],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (pendingLabel === undefined) {
    return (
      <button
        aria-label={ariaLabel}
        className={classes}
        disabled={isDisabled}
        ref={ref}
        type={type}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <>
      <button
        aria-busy={isPending || undefined}
        aria-label={isPending ? pendingLabel : ariaLabel}
        className={classes}
        disabled={isDisabled}
        ref={ref}
        type={type}
        onClick={onClick}
        {...props}
      >
        <span className="grid items-center justify-items-center">
          <span
            aria-hidden={isPending}
            className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${isPending ? 'invisible' : ''}`}
          >
            {children}
          </span>
          <span
            aria-hidden={!isPending}
            className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${isPending ? '' : 'invisible'}`}
          >
            {isPending ? (
              <PendingIndicator className="shrink-0" />
            ) : (
              <span aria-hidden="true" className="size-4 shrink-0" />
            )}
            {pendingLabel}
          </span>
        </span>
      </button>

      {isPending ? (
        <span className="sr-only" role="status">
          {pendingLabel}
        </span>
      ) : null}
    </>
  )
})

Button.displayName = 'Button'

export default Button
