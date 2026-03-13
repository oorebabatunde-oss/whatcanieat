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
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{t("mealplan.swap")}</DialogTitle>
          <DialogDescription className="text-body-xs">{mealName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {SWAP_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => { setSelected(type.value); setRemoveIngredient(null); }}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-left text-sm min-h-[48px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected === type.value
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "bg-card shadow-sm hover:shadow-md"
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
                  "px-3 py-1.5 rounded-full text-xs min-h-[36px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  removeIngredient === ing
                    ? "bg-destructive/10 text-destructive shadow-sm"
                    : "bg-card text-foreground shadow-sm hover:shadow-md"
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
          className="w-full text-sm mt-2 rounded-xl"
        >
          {t("mealplan.swapConfirm")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
