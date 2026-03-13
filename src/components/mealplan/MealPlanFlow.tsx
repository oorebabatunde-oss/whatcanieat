import { MealPlanProvider, useMealPlan } from "./MealPlanContext";
import ConsiderationsScreen from "./ConsiderationsScreen";
import MealPlanResults from "./MealPlanResults";
import { useI18n } from "@/lib/i18n";
import PlateLoader from "@/components/ui/PlateLoader";

function MealPlanInner() {
  const { state, progressMessage } = useMealPlan();
  const { t } = useI18n();

  if (state.step === "loading") {
    return <PlateLoader message={t("mealplan.generating")} progressMessage={progressMessage} />;
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
