import * as React from "react";
import { cn } from "../../lib/cn";

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className={cn("text-sm text-neutral-200", props.className)} />
  );
}
