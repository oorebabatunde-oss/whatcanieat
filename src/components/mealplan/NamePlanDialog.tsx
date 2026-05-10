import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

interface Props {
  open: boolean;
  initialName: string;
  defaultName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}

export default function NamePlanDialog({ open, initialName, defaultName, onCancel, onSave }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (open) setValue(initialName);
  }, [open, initialName]);

  const handleSave = () => {
    const trimmed = value.trim();
    onSave(trimmed.length > 0 ? trimmed : defaultName);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{t("mealplan.namePlanTitle")}</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("mealplan.namePlanPlaceholder")}
          autoFocus
          className="text-base"
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} className="min-h-[44px]">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className="min-h-[44px]">
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
