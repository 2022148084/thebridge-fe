import { AVATARS } from "@/lib/avatars"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  avatarIndex?: number | null
  fallbackInitials?: string
  className?: string
  iconClassName?: string
}

export function UserAvatar({
  avatarIndex,
  fallbackInitials,
  className,
  iconClassName,
}: UserAvatarProps) {
  const valid =
    typeof avatarIndex === "number" &&
    avatarIndex >= 0 &&
    avatarIndex < AVATARS.length

  if (!valid) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-zinc-600 text-sm font-medium text-white",
          className,
        )}
      >
        {fallbackInitials ?? "?"}
      </div>
    )
  }

  const { bg, Icon } = AVATARS[avatarIndex as number]
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white",
        bg,
        className,
      )}
    >
      <Icon className={cn("size-1/2", iconClassName)} />
    </div>
  )
}

export default UserAvatar
