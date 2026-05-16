import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import {
  Briefcase,
  ChevronsUpDown,
  Home,
  LogOut,
  type LucideIcon,
  MapPin,
  Settings,
  UserRound,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { getInitials } from "@/utils"

type NavItem = {
  icon: LucideIcon
  title: string
  path: string
}

const baseItems: NavItem[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: MapPin, title: "Map", path: "/map" },
  { icon: UserRound, title: "Friends", path: "/friends" },
  { icon: Briefcase, title: "Items", path: "/items" },
]

export function BottomNav() {
  const { user, logout } = useAuth()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const items = user?.is_superuser
    ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
    : baseItems

  return (
    <nav className="sticky bottom-0 z-10 flex h-16 items-center justify-between border-t bg-background px-4">
      <ul className="flex flex-1 items-center justify-around gap-1">
        {items.map((item) => {
          const isActive = currentPath === item.path
          const Icon = item.icon
          return (
            <li key={item.path}>
              <RouterLink
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground",
                )}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 gap-2 px-2"
                data-testid="user-menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-zinc-600 text-white">
                    {getInitials(user.full_name || "User")}
                  </AvatarFallback>
                </Avatar>
                <ChevronsUpDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="min-w-56 rounded-lg"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {user.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <RouterLink to="/settings">
                <DropdownMenuItem>
                  <Settings />
                  User Settings
                </DropdownMenuItem>
              </RouterLink>
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </nav>
  )
}

export default BottomNav
