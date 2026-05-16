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
    variant === "responsive" ? (
      <>
        <span
          className={cn(
            "text-lg font-semibold tracking-normal group-data-[collapsible=icon]:hidden",
            className,
          )}
        >
          Hackathon
        </span>
        <span
          className={cn(
            "size-7 hidden place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold group-data-[collapsible=icon]:grid",
            className,
          )}
        >
          HT
        </span>
      </>
    ) : (
      <span
        className={cn(
          variant === "full"
            ? "text-xl font-semibold tracking-normal"
            : "size-7 inline-grid place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold",
          className,
        )}
      >
        {variant === "full" ? "Hackathon" : "HT"}
      </span>
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
