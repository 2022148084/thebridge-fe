import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router"

import { Appearance } from "@/components/Common/Appearance"
import { BottomNav } from "@/components/Nav/BottomNav"
import { isLoggedIn } from "@/hooks/useAuth"

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
  const fullscreen = FULLSCREEN_PATHS.has(pathname)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-end border-b bg-background px-4">
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
