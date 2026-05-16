import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import {
  History,
  type LucideIcon,
  MapPin,
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
  { icon: MapPin, title: "Map", path: "/map" },
  { icon: UsersRound, title: "Friends", path: "/friends" },
  { icon: UserRound, title: "Profile", path: "__profile__" },
  { icon: History, title: "History", path: "/history" },
  { icon: Settings, title: "Settings", path: "__settings__" },
]

const navItemClass =
  "flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"

export function BottomNav() {
  const { user } = useAuth()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const items = user?.is_superuser
    ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
    : baseItems

  return (
    <nav className="sticky bottom-0 z-10 flex h-16 items-center justify-between border-t bg-background px-4">
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
                    >
                      <Icon className="size-5" />
                      <span>{item.title}</span>
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
                    >
                      <Icon className="size-5" />
                      <span>{item.title}</span>
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
                className={cn(navItemClass, isActive && "text-foreground")}
              >
                <Icon className="size-5" />
                <span>{item.title}</span>
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
                className="h-12 w-12 rounded-full shadow-md"
                aria-label="Create gathering"
                data-testid="create-gathering"
              >
                <Plus className="size-5" />
              </Button>
            }
          />
        </div>
      )}
    </nav>
  )
}

export default BottomNav
