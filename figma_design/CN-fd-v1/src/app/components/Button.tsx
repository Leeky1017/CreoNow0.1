import * as React from "react"
import { cn } from "../utils/cn"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "ai"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-white text-black hover:bg-neutral-200": variant === "primary",
            "bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800": variant === "secondary",
            "hover:bg-neutral-800 text-neutral-300 hover:text-white": variant === "ghost",
            "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.5)]": variant === "ai",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-11 px-8": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
