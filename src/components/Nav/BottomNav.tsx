import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import {
  CalendarDays,
  Home,
  type LucideIcon,
  Plus,
  Settings,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react"

import CreateEventDialog from "@/components/Events/CreateEventDialog"
import ProfileDialog from "@/components/Profile/ProfileDialog"
import SettingsDialog from "@/components/Settings/SettingsDialog"
import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

type NavItem = {
  icon: LucideIcon
  title: string
  path: string
}

const baseItems: NavItem[] = [
  { icon: Home, title: "Home", path: "/map" },
  { icon: UsersRound, title: "Friends", path: "/friends" },
  { icon: UserRound, title: "Profile", path: "__profile__" },
  { icon: CalendarDays, title: "History", path: "/history" },
  { icon: Settings, title: "Settings", path: "__settings__" },
]

const navItemClass =
  "flex items-center justify-center rounded-md p-2 text-[#161b24]/50 transition-colors hover:text-[#44a16f]"

export function BottomNav() {
  const { user } = useAuth()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const items = user?.is_superuser
    ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
    : baseItems

  return (
    <nav className="sticky bottom-0 z-10 flex h-[72px] items-center justify-between border-t border-[#b3b9c2]/30 bg-white px-4 shadow-[0_-4px_30px_-10px_rgba(0,0,0,0.1)]">
      <ul className="flex flex-1 items-center justify-start gap-1">
        {items.map((item) => {
          const Icon = item.icon
          if (item.path === "__profile__") {
            if (!user) return null
            return (
              <li key="profile">
                <ProfileDialog
                  trigger={
                    <button
                      type="button"
                      className={navItemClass}
                      data-testid="profile-button"
                      aria-label={item.title}
                    >
                      <Icon className="size-6" />
                    </button>
                  }
                />
              </li>
            )
          }
          if (item.path === "__settings__") {
            if (!user) return null
            return (
              <li key="settings">
                <SettingsDialog
                  trigger={
                    <button
                      type="button"
                      className={navItemClass}
                      data-testid="settings-button"
                      aria-label={item.title}
                    >
                      <Icon className="size-6" />
                    </button>
                  }
                />
              </li>
            )
          }
          const isActive = currentPath === item.path
          return (
            <li key={item.path}>
              <RouterLink
                to={item.path}
                aria-label={item.title}
                className={cn(navItemClass, isActive && "text-[#44a16f]")}
              >
                <Icon className="size-6" />
              </RouterLink>
            </li>
          )
        })}
      </ul>
      {user && (
        <div className="ml-4 shrink-0">
          <CreateEventDialog
            trigger={
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-[#44a16f] text-white shadow-[0_4px_12px_rgba(68,161,111,0.4)] hover:bg-[#3a8f60]"
                aria-label="Create gathering"
                data-testid="create-gathering"
              >
                <Plus className="size-6" />
              </Button>
            }
          />
        </div>
      )}
    </nav>
  )
}

export default BottomNav
