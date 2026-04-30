import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FlowHeaderProps {
  title: string;
  onBack: () => void;
}

export default function FlowHeader({ title, onBack }: FlowHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="pt-4 pb-2 px-3 grid grid-cols-[44px_1fr_44px] items-center">
      <button
        onClick={onBack}
        aria-label={t("common.back")}
        className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-display font-semibold text-primary text-center truncate">
        {title}
      </h1>
      <div aria-hidden="true" />
    </header>
  );
}
