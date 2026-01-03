import WorldIconGrid from "./WorldIconGrid";
import { WorldId } from "../app/modes";

export default function HomeScreen({
  onEnterWorld,
  onOpenProjects,
}: {
  onEnterWorld: (worldId: WorldId) => void;
  onOpenProjects: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col px-6 py-6">
      <div className="text-sm text-white/70">
        Your private IAI. Local-first. Consent-based.
      </div>

      <div className="mt-12 flex-1 flex items-center justify-center">
        <WorldIconGrid onSelect={onEnterWorld} />
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
