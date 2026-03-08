import { useI18n, SUPPORTED_LANGS } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
      <SelectTrigger className="w-auto h-9 gap-1 rounded-full border-border text-xs px-3">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code} className="text-xs">
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
