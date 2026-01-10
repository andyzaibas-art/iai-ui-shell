import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/30">
        <Icon className="h-7 w-7 text-neutral-300" />
      </div>
      <div className="space-y-1">
        <div className="text-base font-semibold text-neutral-100">{title}</div>
        <div className="text-sm text-neutral-400 max-w-md">{description}</div>
      </div>
    </div>
  );
}
