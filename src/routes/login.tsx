import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"

import { LoginForm } from "@/components/Auth/LoginForm"
import { SignupForm } from "@/components/Auth/SignupForm"
import { AuthLayout } from "@/components/Common/AuthLayout"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { isLoggedIn } from "@/hooks/useAuth"

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
    <AuthLayout>
      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => setDialog("login")}>
          Log In
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => setDialog("signup")}
        >
          Sign Up
        </Button>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-sm">
          {dialog === "login" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Login to your account
                </DialogTitle>
              </DialogHeader>
              <LoginForm onSwitchToSignup={() => setDialog("signup")} />
            </>
          )}
          {dialog === "signup" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Create an account
                </DialogTitle>
              </DialogHeader>
              <SignupForm onSwitchToLogin={() => setDialog("login")} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </AuthLayout>
  )
}
