import { Project } from "./ProjectStore";
import { useI18n } from "../i18n";

export default function ProjectList({
  projects,
  onOpenProject,
  onDeleteProject,
  onBackHome,
}: {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onBackHome: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="font-semibold">{t("projects.title")}</div>
        <button className="rounded-xl border px-3 py-2" onClick={onBackHome}>
          {t("projects.back")}
        </button>
      </div>

      <div className="flex-1 p-6">
        {projects.length === 0 ? (
          <div className="opacity-80">{t("projects.empty")}</div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="rounded-2xl border p-4">
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm opacity-70">
                  {p.status} · {new Date(p.updatedAt).toLocaleString()}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-xl border px-3 py-2"
                    onClick={() => onOpenProject(p.id)}
                  >
                    {t("projects.continue")}
                  </button>
                  <button
                    className="rounded-xl border px-3 py-2"
                    onClick={() => onDeleteProject(p.id)}
                  >
                    {t("projects.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
