import * as React from "react";
import { cn } from "../../lib/cn";

export function Badge(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/30 px-2 py-0.5 text-xs text-neutral-200",
        props.className
      )}
    />
  );
}
