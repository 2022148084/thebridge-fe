import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const content =
    variant === "icon" ? (
      <span
        className={cn(
          "size-7 inline-grid place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold",
          className,
        )}
      >
        HT
      </span>
    ) : (
      <img
        src="/assets/images/wbond-logo.png"
        alt="WBOND"
        className={cn(
          variant === "responsive"
            ? "h-7 w-auto group-data-[collapsible=icon]:hidden"
            : "h-8 w-auto",
          className,
        )}
      />
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
