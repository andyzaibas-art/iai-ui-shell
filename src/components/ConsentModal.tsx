import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function ConsentModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Save",
  description = "Are you sure you want to save this content? This will store the data locally in your browser.",
}: ConsentModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl">
          <div className="text-base font-semibold text-neutral-100">{title}</div>
          <div className="mt-2 text-sm text-neutral-400">{description}</div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
