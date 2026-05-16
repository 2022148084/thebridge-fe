import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router"
import { LogOut } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
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

const HEADER_TITLES: Record<string, string> = {
  "/map": "Seoul, KR",
  "/history": "History",
  "/friends": "Add Friends",
  "/admin": "Admin",
}

function Layout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const fullscreen = FULLSCREEN_PATHS.has(pathname)
  const headerTitle = HEADER_TITLES[pathname]

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-[#b3b9c2]/30 bg-white px-4 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2">
          <Logo variant="full" className="h-8" />
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 gap-1 px-2 text-xs text-[#161b24]/60 hover:text-[#44a16f]"
              data-testid="logout-button"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {headerTitle && (
            <span className="font-['Stack_Sans_Headline',_sans-serif] text-xl text-[#161b24]">
              {headerTitle}
            </span>
          )}
          <Appearance />
        </div>
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
