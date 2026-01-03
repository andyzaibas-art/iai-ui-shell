import { useState } from "react";
import WorldIconGrid from "./WorldIconGrid";
import { WorldId } from "../app/modes";

export default function HomeScreen({
  onEnterWorld,
  onOpenProjects,
}: {
  onEnterWorld: (worldId: WorldId) => void;
  onOpenProjects: () => void;
}) {
  const [editIcons, setEditIcons] = useState(false);

  return (
    <div className="h-full flex flex-col px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-white/70">
          Your private IAI. Local-first. Consent-based.
        </div>

        <button
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
          onClick={() => setEditIcons((v) => !v)}
          aria-label="Toggle icon layout edit mode"
          title="Edit icon order"
        >
          {editIcons ? "Done" : "Edit"}
        </button>
      </div>

      {editIcons && (
        <div className="mt-3 text-xs text-white/60">
          Reorder icons with ◀ ▶. In edit mode, clicking an icon won’t open a world.
        </div>
      )}

      <div className="mt-8 flex-1 flex items-center justify-center">
        <WorldIconGrid onSelect={onEnterWorld} editMode={editIcons} />
      </div>

      <div className="pt-6">
        <button
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white"
          onClick={onOpenProjects}
        >
          My projects
        </button>
      </div>
    </div>
  );
}
