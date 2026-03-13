import { MealPlanProvider, useMealPlan } from "./MealPlanContext";
import ConsiderationsScreen from "./ConsiderationsScreen";
import MealPlanResults from "./MealPlanResults";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

function MealPlanInner() {
  const { state } = useMealPlan();
  const { t } = useI18n();

  if (state.step === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-16"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t("mealplan.generating")}</p>
      </motion.div>
    );
  }

  if (state.step === "results" && state.planData) {
    return <MealPlanResults />;
  }

  return <ConsiderationsScreen />;
}

export default function MealPlanFlow() {
  return (
    <MealPlanProvider>
      <MealPlanInner />
    </MealPlanProvider>
  );
}
