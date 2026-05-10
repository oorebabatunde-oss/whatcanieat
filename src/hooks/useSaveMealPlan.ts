import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const GUEST_KEY = "guest_saved_meal_plans";

export function useSaveMealPlan() {
  const { user } = useAuth();

  const savePlan = async (planData: any, considerations: any, duration: number, customName?: string) => {
    const name = customName?.trim() || `${duration}-Day Plan — ${new Date().toLocaleDateString()}`;

    if (user) {
      const { error } = await supabase.from("saved_meal_plans").insert({
        user_id: user.id,
        name,
        plan_data: planData,
        considerations,
        duration,
      });
      if (error) throw error;
    } else {
      const stored = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
      stored.push({
        id: crypto.randomUUID(),
        name,
        plan_data: planData,
        considerations,
        duration,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(GUEST_KEY, JSON.stringify(stored));
    }

    return { name };
  };

  return { savePlan };
}
