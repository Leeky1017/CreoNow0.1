import * as React from "react"
import { cn } from "../utils/cn"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "agent"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[6px] text-[14px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0F0F0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#F0F0F0] text-[#0D0D0D] hover:bg-[#CCCCCC]": variant === "primary",
            "bg-[#1E1E1E] text-[#F0F0F0] border border-[#2A2A2A] hover:bg-[#2A2A2A]": variant === "secondary",
            "hover:bg-[#1E1E1E] text-[#888888] hover:text-[#F0F0F0]": variant === "ghost",
            "bg-[#7AA2F7] text-[#0D0D0D] hover:bg-[#8BB3F8]": variant === "agent",
            "h-[32px] px-[12px] text-[12px]": size === "sm",
            "h-[40px] px-[16px]": size === "md",
            "h-[44px] px-[24px]": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"