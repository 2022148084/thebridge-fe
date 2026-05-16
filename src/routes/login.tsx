import { createFileRoute, redirect } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { useState } from "react"

import { LoginForm } from "@/components/Auth/LoginForm"
import { SignupForm } from "@/components/Auth/SignupForm"
import { Logo } from "@/components/Common/Logo"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { isLoggedIn } from "@/hooks/useAuth"
import { FIGMA_DIALOG } from "@/lib/figma-styles"
import { cn } from "@/lib/utils"

type AuthDialog = "login" | "signup" | null

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Log In - Hackathon Template",
      },
    ],
  }),
})

function Login() {
  const [dialog, setDialog] = useState<AuthDialog>(null)
  const close = () => setDialog(null)

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-white">
      <div
        className="absolute inset-x-0 top-[88px] bottom-[60px] bg-center bg-cover"
        style={{ backgroundImage: "url('/assets/images/landing-map-bg.png')" }}
      />

      <header className="relative z-10 flex h-[88px] shrink-0 items-center px-6 md:px-10">
        <Logo variant="full" className="h-9" asLink={false} />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6">
        <h1 className="font-['Stack_Sans_Headline'] text-4xl font-semibold text-[#161b24] sm:text-6xl">
          Wellness Together
        </h1>
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setDialog("login")}
            className="flex h-12 w-[160px] items-center justify-center gap-2 rounded-lg bg-[#44a16f] font-['Stack_Sans_Headline'] text-lg font-semibold text-white shadow-[0_4px_12px_rgba(68,161,111,0.35)] transition hover:bg-[#3a8f60]"
          >
            Login
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setDialog("signup")}
            className="flex h-12 w-[160px] items-center justify-center gap-2 rounded-lg bg-[#44a16f] font-['Stack_Sans_Headline'] text-lg font-semibold text-white shadow-[0_4px_12px_rgba(68,161,111,0.35)] transition hover:bg-[#3a8f60]"
          >
            Sign up
            <ChevronRight className="size-5" />
          </button>
        </div>
      </main>

      <footer className="relative z-10 flex h-[60px] shrink-0 items-center px-6 md:px-10">
        <span className="text-sm text-[#161b24]/40">
          The Bridge Hackathon 2026 (Team 10)
        </span>
      </footer>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className={cn(FIGMA_DIALOG, "sm:max-w-sm")}>
          {dialog === "login" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl text-[#161b24]">
                  Login to your account
                </DialogTitle>
              </DialogHeader>
              <LoginForm onSwitchToSignup={() => setDialog("signup")} />
            </>
          )}
          {dialog === "signup" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl text-[#161b24]">
                  Create an account
                </DialogTitle>
              </DialogHeader>
              <SignupForm
                onSwitchToLogin={() => setDialog("login")}
                onSuccess={() => setDialog("login")}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
