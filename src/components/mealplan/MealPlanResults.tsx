import React, { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useMealPlan } from "./MealPlanContext";
import { useSaveMealPlan } from "@/hooks/useSaveMealPlan";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Users, DollarSign, ChevronDown, ChevronUp, RefreshCw, Sliders, Save, AlertTriangle, ArrowRightLeft, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SwapDialog from "./SwapDialog";
import NamePlanDialog from "./NamePlanDialog";

const MealPlanResults = React.forwardRef<HTMLDivElement, object>(function MealPlanResults(_props, ref) {
  const { t } = useI18n();
  const { state, regenerate, adjustConstraints, reset } = useMealPlan();
  const { savePlan } = useSaveMealPlan();
  const plan = state.planData;

  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"meals" | "grocery">("meals");
  const [saved, setSaved] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ id: string; name: string; ingredients: string[] } | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  if (!plan) return null;

  const isComplete = state.isComplete;
  const days = plan.days || [];
  const groceryList = plan.groceryList || [];
  const costSummary = plan.costSummary || { total: 0, perDay: 0 };

  const toggleMeal = (mealId: string) => {
    setExpandedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  const toggleGroceryItem = (itemKey: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const defaultPlanName = `${state.duration}-Day Plan — ${new Date().toLocaleDateString()}`;

  const openSaveDialog = () => {
    if (!isComplete) return;
    setNameDialogOpen(true);
  };

  const handleSave = async (name: string) => {
    setNameDialogOpen(false);
    try {
      await savePlan(plan, state.considerations, state.duration, name);
      setSaved(true);
      toast.success(t("saved.planSaved"));
    } catch {
      toast.error(t("error.generationFailed"), { duration: 10000 });
    }
  };

  const groupedGrocery = groceryList.reduce<Record<string, typeof groceryList>>((acc, item) => {
    const aisle = item.aisle || "Other";
    if (!acc[aisle]) acc[aisle] = [];
    acc[aisle].push(item);
    return acc;
  }, {});

  const totalGroceryItems = groceryList.length;
  const checkedCount = [...checkedItems].filter((key) => groceryList.some((_, i) => checkedItems.has(`grocery-${i}`))).length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto flex flex-col gap-4 px-5"
    >
      {/* Still loading indicator */}
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-primary/10 rounded-xl p-3 flex gap-2 items-center text-xs text-primary"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{state.progressMessage || t("loading.step.grocery")}</span>
        </motion.div>
      )}

      {/* Conflicts */}
      {plan.conflicts && plan.conflicts.length > 0 && (
        <div className="bg-caution/10 rounded-xl p-3 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-caution shrink-0 mt-0.5" />
          <div className="text-xs text-foreground space-y-1">
            {plan.conflicts.map((c, i) => <p key={i}>{c}</p>)}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={regenerate} disabled={!isComplete} className="gap-1.5 text-xs min-h-[44px] rounded-xl">
          <RefreshCw className="w-3.5 h-3.5" /> {t("mealplan.regenerate")}
        </Button>
        <Button variant="outline" size="sm" onClick={adjustConstraints} className="gap-1.5 text-xs min-h-[44px] rounded-xl">
          <Sliders className="w-3.5 h-3.5" /> {t("mealplan.adjust")}
        </Button>
        <Button variant="outline" size="sm" onClick={openSaveDialog} disabled={saved || !isComplete} className="gap-1.5 text-xs min-h-[44px] rounded-xl">
          <Save className="w-3.5 h-3.5" /> {saved ? t("saved.planSaved") : t("mealplan.save")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { reset(); setCheckedItems(new Set()); }} className="gap-1.5 text-xs min-h-[44px] rounded-xl">
          <RotateCcw className="w-3.5 h-3.5" /> {t("mealplan.newPlan")}
        </Button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button variant={activeTab === "meals" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("meals")} className="flex-1 text-xs min-h-[44px] rounded-xl">
          {t("mealplan.tabMeals")}
        </Button>
        <Button variant={activeTab === "grocery" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("grocery")} className="flex-1 text-xs min-h-[44px] rounded-xl">
          {t("mealplan.tabGrocery")} {!isComplete && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
        </Button>
      </div>

      {activeTab === "meals" && (
        <div className="flex flex-col gap-4">
          {days.map((day) => (
            <div key={day.dayNumber} className="flex flex-col gap-2">
              <h3 className="text-body-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("mealplan.dayLabel")} {day.dayNumber}
              </h3>
              {day.meals.map((meal) => (
                <motion.div key={meal.id} className="glass-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <button onClick={() => toggleMeal(meal.id)} className="w-full p-3.5 flex items-center justify-between text-left min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-foreground text-sm truncate">{meal.name}</span>
                      {meal.isCapsule && <Badge variant="secondary" className="text-[10px] shrink-0">Quick</Badge>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                      <span className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.prepTime}m</span>
                      {expandedMeals[meal.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {expandedMeals[meal.id] && (
                    <div className="px-3.5 pb-3.5 border-t border-border/50 pt-3 space-y-3">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {meal.servings} servings</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ~£{meal.estimatedCost.toFixed(2)}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1">Ingredients</h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {meal.ingredients.map((ing, i) => <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>)}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1">Steps</h4>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          {meal.steps.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                      </div>

                      {meal.substitutions && meal.substitutions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-1">Substitutions</h4>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {meal.substitutions.map((sub, i) => <li key={i}>{sub.original} → {sub.alternative}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1.5 text-muted-foreground min-h-[44px]"
                          disabled={!isComplete}
                          onClick={() => setSwapTarget({ id: meal.id, name: meal.name, ingredients: meal.ingredients.map((i) => i.name) })}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" /> {t("mealplan.swap")}
                        </Button>
                        {!isComplete && (
                          <span className="text-[10px] text-muted-foreground/60 text-center -mt-1">{t("mealplan.swapDisabled")}</span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}

          {isComplete && costSummary && (
            <div className="bg-muted/50 rounded-xl p-3.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Estimated total:</span> ~£{costSummary.total.toFixed(2)}
              {" · "}~£{costSummary.perDay.toFixed(2)}/day
            </div>
          )}

          {isComplete && plan.nutritionNotes && plan.nutritionNotes.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-3.5 text-xs text-muted-foreground space-y-1">
              {plan.nutritionNotes.map((note, i) => <p key={i}>• {note}</p>)}
            </div>
          )}
        </div>
      )}

      {activeTab === "grocery" && (
        <div className="flex flex-col gap-3">
          {!isComplete ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">{t("loading.step.grocery")}</p>
              <p className="text-xs italic">{t("loading.groceryWait")}</p>
            </div>
          ) : (
            <>
              {/* Checked counter */}
              <div className="text-xs text-muted-foreground">
                {checkedItems.size} / {totalGroceryItems} {t("mealplan.groceryChecked")}
              </div>

              {Object.entries(groupedGrocery).map(([aisle, items]) => (
                <div key={aisle}>
                  <h4 className="text-body-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{aisle}</h4>
                  <div className="glass-card rounded-xl overflow-hidden shadow-sm">
                    {items.map((item, i) => {
                      const globalIndex = groceryList.indexOf(item);
                      const itemKey = `grocery-${globalIndex}`;
                      const isChecked = checkedItems.has(itemKey);
                      return (
                        <div
                          key={i}
                          className={`px-3.5 py-2.5 flex items-center gap-3 text-sm cursor-pointer transition-colors hover:bg-muted/30 ${i > 0 ? "border-t border-border/50" : ""}`}
                          onClick={() => toggleGroceryItem(itemKey)}
                        >
                          <Checkbox
                            checked={isChecked}
                            className="shrink-0 pointer-events-none"
                          />
                          <div className={`min-w-0 flex-1 ${isChecked ? "line-through opacity-50" : ""}`}>
                            <span className="text-foreground">{item.name}</span>
                            <span className="text-muted-foreground text-xs ml-1">
                              {item.totalQuantity}{item.unit && !item.totalQuantity.toLowerCase().includes(item.unit.toLowerCase()) ? ` ${item.unit}` : ""}
                            </span>
                            {item.recipesUsedIn.length > 0 && (
                              <p className="text-[10px] text-muted-foreground truncate">Used in: {item.recipesUsedIn.join(", ")}</p>
                            )}
                          </div>
                          <span className={`text-xs text-muted-foreground shrink-0 ${isChecked ? "line-through opacity-50" : ""}`}>~£{item.estimatedPrice.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {costSummary && (
                <div className="bg-muted/50 rounded-xl p-3.5 text-xs text-foreground font-semibold">
                  Total: ~£{costSummary.total.toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {swapTarget && (
        <SwapDialog
          mealId={swapTarget.id}
          mealName={swapTarget.name}
          ingredients={swapTarget.ingredients}
          onClose={() => setSwapTarget(null)}
        />
      )}

      <NamePlanDialog
        open={nameDialogOpen}
        initialName={defaultPlanName}
        defaultName={defaultPlanName}
        onCancel={() => setNameDialogOpen(false)}
        onSave={handleSave}
      />
    </motion.div>
  );
});

export default MealPlanResults;
