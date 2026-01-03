import { useI18n } from "../../i18n";

export default function ComingSoon({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{title}</div>
      <div className="opacity-80">{description}</div>

      <div className="rounded-2xl border p-4">
        <div className="font-semibold">{t("coming.soon")}</div>
        <div className="mt-2 text-sm opacity-70">{t("coming.body")}</div>
      </div>

      <button className="rounded-xl border px-4 py-3" onClick={onBack}>
        {t("coming.back")}
      </button>
    </div>
  );
}
