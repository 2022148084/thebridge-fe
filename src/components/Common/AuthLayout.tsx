import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex justify-end p-6 md:p-10">
        <Appearance />
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-6 md:px-10 md:pb-10">
        <div className="flex w-full max-w-xs flex-col items-center gap-8">
          <Logo variant="full" className="h-16" asLink={false} />
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  )
}
