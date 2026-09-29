type FacebookIconProps = {
  className?: string
}

function FacebookIcon({ className }: FacebookIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.79-3.9 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.57V12h2.79l-.45 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"
        fill="#1877F2"
      />
      <path
        d="m15.91 14.89.45-2.89h-2.79v-1.86c0-.79.39-1.57 1.64-1.57h1.27V6.1s-1.15-.2-2.25-.2c-2.29 0-3.79 1.39-3.79 3.9V12H7.9v2.89h2.54v6.99a10.13 10.13 0 0 0 3.13 0v-6.99h2.34Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export default FacebookIcon
