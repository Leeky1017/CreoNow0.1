import * as React from "react";
import { cn } from "../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[40px] w-full rounded-[6px] border border-[#2A2A2A] bg-[#111111] px-[12px] py-[8px] text-[14px] text-[#F0F0F0] placeholder:text-[#555555]",
          "focus-visible:outline-none focus-visible:border-[#3A3A3A] disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150",
          error && "border-[#F87171] focus-visible:border-[#F87171]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
