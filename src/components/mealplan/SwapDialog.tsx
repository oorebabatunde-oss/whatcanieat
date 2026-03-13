import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useMealPlan } from "./MealPlanContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SwapDialogProps {
  mealId: string;
  mealName: string;
  ingredients: string[];
  onClose: () => void;
}

const SWAP_TYPES = [
  { value: "cheaper", emoji: "💰", labelKey: "mealplan.swap.cheaper" },
  { value: "faster", emoji: "⚡", labelKey: "mealplan.swap.faster" },
  { value: "similar", emoji: "🔄", labelKey: "mealplan.swap.similar" },
  { value: "remove-ingredient", emoji: "🚫", labelKey: "mealplan.swap.remove" },
];

export default function SwapDialog({ mealId, mealName, ingredients, onClose }: SwapDialogProps) {
  const { t } = useI18n();
  const { swapMeal } = useMealPlan();
  const [selected, setSelected] = useState<string | null>(null);
  const [removeIngredient, setRemoveIngredient] = useState<string | null>(null);

  const handleSwap = () => {
    if (!selected) return;
    swapMeal(mealId, mealName, selected, selected === "remove-ingredient" ? removeIngredient || undefined : undefined);
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{t("mealplan.swap")}</DialogTitle>
          <DialogDescription className="text-xs">{mealName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {SWAP_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => { setSelected(type.value); setRemoveIngredient(null); }}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all",
                selected === type.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span>{type.emoji}</span>
              <span className="text-foreground">{t(type.labelKey)}</span>
            </button>
          ))}
        </div>

        {selected === "remove-ingredient" && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ingredients.map((ing) => (
              <button
                key={ing}
                onClick={() => setRemoveIngredient(ing)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  removeIngredient === ing
                    ? "bg-destructive/10 border-destructive text-destructive"
                    : "border-border text-foreground hover:border-destructive/40"
                )}
              >
                {ing}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleSwap}
          disabled={!selected || (selected === "remove-ingredient" && !removeIngredient)}
          className="w-full text-sm mt-2"
        >
          {t("mealplan.swapConfirm")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
