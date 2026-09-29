export type PendingIndicatorProps = {
  className?: string
}

function PendingIndicator({ className }: PendingIndicatorProps) {
  const classes = [
    'size-4 animate-spin rounded-pill border-2 border-border border-t-text motion-reduce:animate-none',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span aria-hidden="true" className={classes} />
}

export default PendingIndicator
