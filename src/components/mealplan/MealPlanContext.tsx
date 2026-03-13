import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { sendCompletionNotification } from "@/components/ui/PlateLoader";
import { useI18n } from "@/lib/i18n";

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
  progressMessage: string | null;
  isComplete: boolean; // true when grocery list is ready
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
  progressMessage: string | null;
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
  progressMessage: null,
  isComplete: false,
};

function loadState(): MealPlanState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (![1, 3, 7, 30].includes(parsed.duration)) parsed.duration = 3;
      if (!["considerations", "loading", "results"].includes(parsed.step)) parsed.step = "considerations";
      if (parsed.step === "loading") parsed.step = "considerations";
      return { ...initialState, ...parsed };
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return initialState;
}

// Unified SSE fetch for all durations
async function callGeneratePlan(
  considerations: Considerations,
  duration: number,
  swap: any | undefined,
  onProgress: (msg: string) => void,
  onChunkReady: (days: PlanData["days"]) => void,
  onComplete: (plan: PlanData) => void,
  tFn: (key: string) => string,
): Promise<PlanData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-meal-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
      "apikey": supabaseKey,
    },
    body: JSON.stringify({ considerations, duration, swap }),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || "Failed to generate plan");
    } catch (e) {
      if (e instanceof Error && e.message !== "Failed to generate plan") throw e;
      throw new Error("Failed to generate plan");
    }
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream")) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let plan: PlanData | null = null;
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "progress" && data.message) {
              onProgress(data.message);
            } else if (currentEvent === "chunk_ready" && data.days) {
              onChunkReady(data.days);
            } else if (currentEvent === "complete" && data.plan) {
              plan = data.plan;
              onComplete(data.plan);
            } else if (currentEvent === "error") {
              throw new Error(data.error || "Generation failed");
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Generation failed") {
              // JSON parse error — skip malformed line
            } else {
              throw e;
            }
          }
        }
      }
    }

    if (!plan) throw new Error("No plan received");

    // Send browser notification
    try {
      if (localStorage.getItem("mealplan-notify") === "true") {
        sendCompletionNotification(tFn);
      }
    } catch {}

    return plan;
  }

  // Fallback: regular JSON response
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  onComplete(data.plan);
  return data.plan;
}

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MealPlanState>(loadState);
  const { t } = useI18n();

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setConsiderations = (c: Considerations) => setState((s) => ({ ...s, considerations: c }));
  const setDuration = (d: 1 | 3 | 7 | 30) => setState((s) => ({ ...s, duration: d }));

  const generatePlan = async () => {
    setState((s) => ({ ...s, step: "loading", error: null, progressMessage: null, planData: null, isComplete: false }));
    try {
      const plan = await callGeneratePlan(
        state.considerations,
        state.duration,
        undefined,
        (msg) => setState((s) => ({ ...s, progressMessage: msg })),
        (days) => {
          // Progressive: show results as soon as first chunk arrives
          setState((s) => {
            const existingDays = s.planData?.days || [];
            const newPlan: PlanData = {
              days: [...existingDays, ...days],
              groceryList: [],
              costSummary: { total: 0, perDay: 0 },
            };
            return { ...s, step: "results", planData: newPlan, isComplete: false };
          });
        },
        (completePlan) => {
          setState((s) => ({ ...s, step: "results", planData: completePlan, isComplete: true, progressMessage: null }));
        },
        t,
      );
      if (plan.days && plan.days.length > state.duration) {
        plan.days = plan.days.slice(0, state.duration);
      }
      setState((s) => ({ ...s, step: "results", planData: plan, error: null, progressMessage: null, isComplete: true }));
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setState((s) => ({ ...s, step: "considerations", error: msg, progressMessage: null }));
      toast({ title: "Couldn't generate plan", description: msg, variant: "destructive" });
    }
  };

  const swapMeal = async (mealId: string, mealName: string, type: string, removeIngredient?: string) => {
    if (!state.planData) return;
    setState((s) => ({ ...s, step: "loading", error: null, isComplete: false }));
    try {
      const plan = await callGeneratePlan(
        state.considerations,
        state.duration,
        { mealId, mealName, type, removeIngredient, currentPlan: state.planData },
        (msg) => setState((s) => ({ ...s, progressMessage: msg })),
        () => {},
        () => {},
        t,
      );
      setState((s) => ({ ...s, step: "results", planData: plan, error: null, isComplete: true }));
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setState((s) => ({ ...s, step: "results", error: msg }));
      toast({ title: "Couldn't swap meal", description: msg, variant: "destructive" });
    }
  };

  const regenerate = async () => { await generatePlan(); };
  const adjustConstraints = () => { setState((s) => ({ ...s, step: "considerations" })); };
  const goBackToResults = () => { if (state.planData) setState((s) => ({ ...s, step: "results" })); };
  const reset = () => { sessionStorage.removeItem(STORAGE_KEY); setState(initialState); };

  return (
    <MealPlanContext.Provider value={{ state, setConsiderations, setDuration, generatePlan, swapMeal, regenerate, adjustConstraints, goBackToResults, reset, progressMessage: state.progressMessage }}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used within MealPlanProvider");
  return ctx;
}
