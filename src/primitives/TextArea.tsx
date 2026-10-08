import { useId, type ComponentProps, type ReactNode, type Ref } from 'react'

export type TextAreaProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string
  error?: string
  hint?: ReactNode
  id?: string
  inputRef?: Ref<HTMLTextAreaElement>
}

const inputClasses =
  'block min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-base leading-6 text-text placeholder:text-text-muted transition-[color,background-color,border-color] duration-fast ease-out hover:border-text-muted focus-visible:border-focus disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted disabled:hover:border-border aria-invalid:border-accent'

function TextArea({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  disabled,
  error,
  hint,
  id,
  inputRef,
  label,
  ...props
}: TextAreaProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  let descriptionId
  let supportingText: ReactNode = null

  if (error) {
    descriptionId = errorId
    supportingText = (
      <p className="m-0 font-medium text-text" id={errorId} role="alert">
        <span className="text-accent">Error:</span> {error}
      </p>
    )
  } else if (hint) {
    descriptionId = hintId
    supportingText = (
      <p className="m-0 text-text-muted" id={hintId}>
        {hint}
      </p>
    )
  }

  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(' ')
  const classes = [inputClasses, className].filter(Boolean).join(' ')

  return (
    <div className="w-full">
      <label
        className="mb-1.5 block text-sm leading-5 font-bold text-text"
        htmlFor={inputId}
      >
        {label}
      </label>
      <textarea
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={`${classes} resize-none`}
        disabled={disabled}
        id={inputId}
        ref={inputRef}
        {...props}
      />
      <div className="min-h-6 pt-2 text-sm leading-4">{supportingText}</div>
    </div>
  )
}

export default TextArea
