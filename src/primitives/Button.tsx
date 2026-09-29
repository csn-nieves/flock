import type { ComponentProps } from 'react'

export type ButtonVariant = 'primary' | 'secondary'

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
}

const baseClasses =
  'inline-flex min-h-touch cursor-pointer select-none items-center justify-center gap-2 rounded-md px-4 py-2 font-bold leading-5 transition-[color,background-color,border-color,transform] duration-fast ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-primary text-on-primary hover:bg-primary-bright active:bg-primary-strong active:text-background disabled:bg-primary disabled:text-on-primary',
  secondary:
    'border border-border bg-background text-text hover:bg-surface-subtle active:border-text active:bg-surface-subtle disabled:border-border disabled:bg-background disabled:text-text',
}

function Button({
  className,
  onClick,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const classes = [baseClasses, variantClasses[variant], className]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} type={type} onClick={onClick} {...props} />
}

export default Button
