import { useProfileAvatarUrl } from '@src/hooks/useProfileAvatarUrl'

export type ProfileAvatarProps = {
  className: string
  displayName: string
  fallbackClassName: string
  userId: string
}

function ProfileAvatar({
  className,
  displayName,
  fallbackClassName,
  userId,
}: ProfileAvatarProps) {
  const { data: avatarUrl } = useProfileAvatarUrl(userId)
  const initial = displayName.trim().charAt(0).toLocaleUpperCase() || '?'

  return avatarUrl ? (
    <img
      alt=""
      aria-hidden="true"
      className={`${className} overflow-hidden object-cover`}
      src={avatarUrl}
    />
  ) : (
    <span aria-hidden="true" className={`${className} ${fallbackClassName}`}>
      {initial}
    </span>
  )
}

export default ProfileAvatar
