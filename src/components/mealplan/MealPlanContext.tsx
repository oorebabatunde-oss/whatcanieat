import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Considerations {
  safety: string[];
  practical: {
    budget?: { amount: number; currency: string; period: "day" | "week" | "month" };
    maxPrepTime?: number;
    mealsPerDay?: number;
    cookingSkill?: "beginner" | "simple" | "comfortable";
    equipment?: string[];
    cookingPattern?: "daily" | "batch" | "no-cook-weekdays";
    storage?: "freezer" | "fridge-only" | "limited";
    familySize?: number;
    capsuleRatio?: "none" | "some" | "mostly";
  };
  preferences: string[];
  nuance: string;
}

export interface PlanData {
  days: {
    dayNumber: number;
    meals: {
      id: string;
      name: string;
      isCapsule?: boolean;
      prepTime: number;
      servings: number;
      estimatedCost: number;
      ingredients: { name: string; quantity: string; unit: string }[];
      steps: string[];
      substitutions?: { original: string; alternative: string }[];
    }[];
  }[];
  groceryList: {
    name: string;
    totalQuantity: string;
    unit: string;
    estimatedPrice: number;
    aisle: string;
    recipesUsedIn: string[];
  }[];
  costSummary: { total: number; perDay: number; perMeal?: number };
  nutritionNotes?: string[];
  conflicts?: string[];
}

type MealPlanStep = "considerations" | "loading" | "results";

interface MealPlanState {
  step: MealPlanStep;
  considerations: Considerations;
  duration: 1 | 3 | 7 | 30;
  planData: PlanData | null;
  error: string | null;
}

interface MealPlanContextType {
  state: MealPlanState;
  setConsiderations: (c: Considerations) => void;
  setDuration: (d: 1 | 3 | 7 | 30) => void;
  generatePlan: () => Promise<void>;
  swapMeal: (mealId: string, mealName: string, type: string, removeIngredient?: string) => Promise<void>;
  regenerate: () => Promise<void>;
  adjustConstraints: () => void;
  goBackToResults: () => void;
  reset: () => void;
}

const MealPlanContext = createContext<MealPlanContextType | null>(null);

const STORAGE_KEY = "mealplan-state";

const defaultConsiderations: Considerations = {
  safety: [],
  practical: {},
  preferences: [],
  nuance: "",
};

const initialState: MealPlanState = {
  step: "considerations",
  considerations: defaultConsiderations,
  duration: 3,
  planData: null,
  error: null,
};

function loadState(): MealPlanState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate duration
      if (![1, 3, 7, 30].includes(parsed.duration)) parsed.duration = 3;
      // Validate step
      if (!["considerations", "loading", "results"].includes(parsed.step)) parsed.step = "considerations";
      // If was loading, reset to considerations
      if (parsed.step === "loading") parsed.step = "considerations";
      return { ...initialState, ...parsed };
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return initialState;
}

async function callGeneratePlan(considerations: Considerations, duration: number, swap?: any): Promise<PlanData> {
  const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
    body: { considerations, duration, swap },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate plan");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.plan;
}

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MealPlanState>(loadState);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setConsiderations = (c: Considerations) => setState((s) => ({ ...s, considerations: c }));
  const setDuration = (d: 1 | 3 | 7 | 30) => setState((s) => ({ ...s, duration: d }));

  const generatePlan = async () => {
    setState((s) => ({ ...s, step: "loading", error: null }));
    try {
      const plan = await callGeneratePlan(state.considerations, state.duration);
      // Client-side validation: trim days to requested duration
      if (plan.days && plan.days.length > state.duration) {
        plan.days = plan.days.slice(0, state.duration);
      }
      setState((s) => ({ ...s, step: "results", planData: plan, error: null }));
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setState((s) => ({ ...s, step: "considerations", error: msg }));
      toast({ title: "Couldn't generate plan", description: msg, variant: "destructive" });
    }
  };

  const swapMeal = async (mealId: string, mealName: string, type: string, removeIngredient?: string) => {
    if (!state.planData) return;
    setState((s) => ({ ...s, step: "loading", error: null }));
    try {
      const plan = await callGeneratePlan(state.considerations, state.duration, {
        mealId,
        mealName,
        type,
        removeIngredient,
        currentPlan: state.planData,
      });
      setState((s) => ({ ...s, step: "results", planData: plan, error: null }));
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setState((s) => ({ ...s, step: "results", error: msg }));
      toast({ title: "Couldn't swap meal", description: msg, variant: "destructive" });
    }
  };

  const regenerate = async () => {
    await generatePlan();
  };

  const adjustConstraints = () => {
    setState((s) => ({ ...s, step: "considerations" }));
  };

  const goBackToResults = () => {
    if (state.planData) {
      setState((s) => ({ ...s, step: "results" }));
    }
  };

  const reset = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  return (
    <MealPlanContext.Provider value={{ state, setConsiderations, setDuration, generatePlan, swapMeal, regenerate, adjustConstraints, goBackToResults, reset }}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used within MealPlanProvider");
  return ctx;
}
