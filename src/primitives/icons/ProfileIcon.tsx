type ProfileIconProps = {
  className?: string
}

function ProfileIcon({ className }: ProfileIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 20c.7-3.5 3-5.3 6.5-5.3s5.8 1.8 6.5 5.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

export default ProfileIcon
