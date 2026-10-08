type SettingsIconProps = {
  className?: string
}

function SettingsIcon({ className }: SettingsIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d="M9.6 3.8 10.2 2h3.6l.6 1.8 1.6.9 1.8-.5 1.8 3.1-1.3 1.3v1.8l1.3 1.3-1.8 3.1-1.8-.5-1.6.9-.6 1.8h-3.6l-.6-1.8-1.6-.9-1.8.5-1.8-3.1 1.3-1.3V8.6L4.4 7.3l1.8-3.1 1.8.5 1.6-.9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="9.5"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

export default SettingsIcon
