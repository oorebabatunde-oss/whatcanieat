import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronRight, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SavedPlanView from "@/components/mealplan/SavedPlanView";
import NamePlanDialog from "@/components/mealplan/NamePlanDialog";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface SavedPlan {
  id: string;
  name: string;
  plan_data: any;
  considerations: any;
  duration: number;
  created_at: string;
}

const GUEST_KEY = "guest_saved_meal_plans";

interface Props {
  user: User | null;
  authLoading: boolean;
}

export default function SavedMealPlans({ user, authLoading }: Props) {
  const { t } = useI18n();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPlan, setViewingPlan] = useState<SavedPlan | null>(null);
  const [renaming, setRenaming] = useState<SavedPlan | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const fetchPlans = async () => {
      if (user) {
        const { data } = await supabase
          .from("saved_meal_plans")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setPlans(data as SavedPlan[]);
      } else {
        const stored = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]") as SavedPlan[];
        setPlans(stored.reverse());
      }
      setLoading(false);
    };
    fetchPlans();
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    if (user) {
      await supabase.from("saved_meal_plans").delete().eq("id", id);
    } else {
      const stored = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]") as SavedPlan[];
      localStorage.setItem(GUEST_KEY, JSON.stringify(stored.filter((p) => p.id !== id)));
    }
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRename = async (newName: string) => {
    if (!renaming) return;
    const id = renaming.id;
    setRenaming(null);
    if (user) {
      const { error } = await supabase
        .from("saved_meal_plans")
        .update({ name: newName })
        .eq("id", id);
      if (error) {
        toast.error(error.message, { duration: 10000 });
        return;
      }
    } else {
      const stored = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]") as SavedPlan[];
      const updated = stored.map((p) => (p.id === id ? { ...p, name: newName } : p));
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    }
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
    if (viewingPlan?.id === id) setViewingPlan({ ...viewingPlan, name: newName });
    toast.success(t("saved.planRenamed"));
  };

  if (viewingPlan) {
    return (
      <SavedPlanView
        planId={viewingPlan.id}
        planData={viewingPlan.plan_data}
        planName={viewingPlan.name}
        onBack={() => setViewingPlan(null)}
      />
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">{t("saved.emptyPlans")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
          >
            <div className="p-3 flex items-center gap-2">
              <button
                onClick={() => setViewingPlan(plan)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-display font-semibold text-foreground text-sm truncate">
                      {plan.name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {plan.duration} {t("saved.planDuration")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setRenaming(plan)}
                aria-label={t("saved.renamePlan")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(plan.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <NamePlanDialog
        open={renaming !== null}
        initialName={renaming?.name || ""}
        defaultName={renaming?.name || "Meal Plan"}
        onCancel={() => setRenaming(null)}
        onSave={handleRename}
      />
    </div>
  );
}
