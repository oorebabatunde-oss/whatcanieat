import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Meal {
  id: string;
  name: string;
  isCapsule?: boolean;
  prepTime: number;
  servings: number;
  estimatedCost: number;
  ingredients: Ingredient[];
  steps: string[];
  substitutions?: { original: string; alternative: string }[];
}

interface Day {
  dayNumber: number;
  meals: Meal[];
}

interface GroceryItem {
  name: string;
  totalQuantity: string;
  unit: string;
  estimatedPrice: number;
  aisle: string;
  recipesUsedIn: string[];
}

interface PlanData {
  days: Day[];
  groceryList: GroceryItem[];
  costSummary: { total: number; perDay: number; perMeal?: number };
  nutritionNotes?: string[];
  conflicts?: string[];
}

interface SavedPlanViewProps {
  planData: PlanData;
  planName: string;
  onBack: () => void;
}

export default function SavedPlanView({ planData, planName, onBack }: SavedPlanViewProps) {
  const { t } = useI18n();
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"meals" | "grocery">("meals");

  const toggleMeal = (mealId: string) => {
    setExpandedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  const groupedGrocery = planData.groceryList.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const aisle = item.aisle || "Other";
    if (!acc[aisle]) acc[aisle] = [];
    acc[aisle].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-display font-bold text-foreground">{planName}</h2>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "meals" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("meals")}
          className="flex-1 text-xs"
        >
          Meals
        </Button>
        <Button
          variant={activeTab === "grocery" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("grocery")}
          className="flex-1 text-xs"
        >
          Grocery List
        </Button>
      </div>

      {activeTab === "meals" && (
        <div className="flex flex-col gap-4">
          {planData.days.map((day) => (
            <div key={day.dayNumber} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Day {day.dayNumber}
              </h3>
              {day.meals.map((meal) => (
                <motion.div
                  key={meal.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={() => toggleMeal(meal.id)}
                    className="w-full p-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-foreground text-sm truncate">{meal.name}</span>
                      {meal.isCapsule && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">Quick</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                      <span className="text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {meal.prepTime}m
                      </span>
                      {expandedMeals[meal.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {expandedMeals[meal.id] && (
                    <div className="px-3 pb-3 border-t border-border pt-3 space-y-3">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {meal.servings} servings
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> ~£{meal.estimatedCost.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1">Ingredients</h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {meal.ingredients.map((ing, i) => (
                            <li key={i}>
                              {ing.quantity} {ing.unit} {ing.name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1">Steps</h4>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          {meal.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {meal.substitutions && meal.substitutions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-1">Substitutions</h4>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {meal.substitutions.map((sub, i) => (
                              <li key={i}>{sub.original} → {sub.alternative}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}

          {planData.costSummary && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Estimated total:</span> ~£{planData.costSummary.total.toFixed(2)}
              {" · "}~£{planData.costSummary.perDay.toFixed(2)}/day
            </div>
          )}
        </div>
      )}

      {activeTab === "grocery" && (
        <div className="flex flex-col gap-3">
          {Object.entries(groupedGrocery).map(([aisle, items]) => (
            <div key={aisle}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {aisle}
              </h4>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 flex items-center justify-between text-sm ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground text-xs ml-1">
                        {item.totalQuantity}{item.unit && !item.totalQuantity.toLowerCase().includes(item.unit.toLowerCase()) ? ` ${item.unit}` : ""}
                      </span>
                      {item.recipesUsedIn.length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          Used in: {item.recipesUsedIn.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ~£{item.estimatedPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {planData.costSummary && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground font-semibold">
              Total: ~£{planData.costSummary.total.toFixed(2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
