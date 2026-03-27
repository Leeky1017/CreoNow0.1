import * as React from "react";
import { cn } from "../utils/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-800/60 bg-[#111111] text-neutral-100 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
