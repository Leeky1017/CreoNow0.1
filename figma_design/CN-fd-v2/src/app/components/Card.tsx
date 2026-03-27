import * as React from "react"
import { cn } from "../utils/cn"

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0] p-[20px] hover:border-[#3A3A3A] transition-colors duration-150",
        className
      )}
      {...props}
    />
  )
}
