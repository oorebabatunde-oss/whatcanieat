import { motion } from "framer-motion";
import { useQuiz, DietaryConstraint } from "./QuizContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function DietaryStep() {
  const { state, toggleDietary, nextStep } = useQuiz();
  const { t } = useI18n();
  const isNone = state.dietary.includes("none");
  const hasSelection = state.dietary.length > 0;

  const dietaryOptions: { type: DietaryConstraint; label: string; emoji: string }[] = [
    { type: "vegetarian", label: t("quiz.dietary.vegetarian"), emoji: "🥬" },
    { type: "vegan", label: t("quiz.dietary.vegan"), emoji: "🌱" },
    { type: "gluten-free", label: t("quiz.dietary.glutenFree"), emoji: "🌾" },
    { type: "dairy-free", label: t("quiz.dietary.dairyFree"), emoji: "🥛" },
    { type: "nut-free", label: t("quiz.dietary.nutFree"), emoji: "🥜" },
    { type: "halal", label: t("quiz.dietary.halal"), emoji: "☪️" },
    { type: "kosher", label: t("quiz.dietary.kosher"), emoji: "✡️" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
        {t("quiz.dietary.title")}
      </h2>
      <p className="text-muted-foreground text-center text-xs uppercase tracking-widest">
        {t("quiz.dietary.subtitle")}
      </p>
      <div className="flex flex-wrap justify-center gap-3 w-full">
        {dietaryOptions.map((d, i) => {
          const selected = state.dietary.includes(d.type);
          return (
            <motion.button
              key={d.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleDietary(d.type)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
                selected
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-card text-foreground border border-border hover:border-primary/30"
              }`}
            >
              <span>{d.emoji}</span>
              {d.label}
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleDietary("none")}
          className={`rounded-lg px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
            isNone
              ? "bg-primary text-primary-foreground shadow-lg scale-105"
              : "bg-card text-foreground border border-border hover:border-primary/30"
          }`}
        >
          ✅ {t("quiz.dietary.none")}
        </motion.button>
      </div>
      <Button
        onClick={nextStep}
        disabled={!hasSelection}
        size="lg"
        className="w-full max-w-xs mt-4 rounded-lg font-semibold tracking-wide"
      >
        {t("quiz.next")} <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
}
