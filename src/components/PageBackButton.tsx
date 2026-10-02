import Button from '@src/primitives/Button'

type PageBackButtonProps = {
  label: string
  onBack: () => void
}

function PageBackButton({ label, onBack }: PageBackButtonProps) {
  return (
    <Button className="!hidden" variant="secondary" onClick={onBack}>
      <svg
        aria-hidden="true"
        className="size-4 shrink-0"
        fill="none"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <path
          d="m15 18-6-6 6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      {label}
    </Button>
  )
}

export default PageBackButton
