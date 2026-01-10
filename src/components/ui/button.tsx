import * as React from "react";
import { cn } from "../../lib/cn";

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "icon" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600",
          "disabled:opacity-50 disabled:pointer-events-none",
          variant === "default" && "bg-neutral-100 text-neutral-900 hover:bg-white",
          variant === "outline" &&
            "border border-neutral-800 bg-neutral-950 text-neutral-100 hover:bg-neutral-900",
          variant === "ghost" &&
            "bg-transparent text-neutral-100 hover:bg-neutral-900/60",
          size === "default" && "h-10 px-4",
          size === "icon" && "h-10 w-10",
          size === "lg" && "h-12 px-5 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
