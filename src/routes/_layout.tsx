import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router"
import { LogOut } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { BottomNav } from "@/components/Nav/BottomNav"
import { Button } from "@/components/ui/button"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

const FULLSCREEN_PATHS = new Set(["/map"])

function Layout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const fullscreen = FULLSCREEN_PATHS.has(pathname)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-wide">WBOND</span>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              data-testid="logout-button"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          )}
        </div>
        <Appearance />
      </header>
      {fullscreen ? (
        <main className="h-[calc(100svh-3.5rem-4rem)] overflow-hidden">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      )}
      <BottomNav />
    </div>
  )
}

export default Layout
