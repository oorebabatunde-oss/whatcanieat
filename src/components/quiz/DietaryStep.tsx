import { motion } from "framer-motion";
import { useQuiz, DietaryConstraint } from "./QuizContext";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const dietaryOptions: { type: DietaryConstraint; label: string; emoji: string }[] = [
  { type: "vegetarian", label: "Vegetarian", emoji: "🥬" },
  { type: "vegan", label: "Vegan", emoji: "🌱" },
  { type: "gluten-free", label: "Gluten-Free", emoji: "🌾" },
  { type: "dairy-free", label: "Dairy-Free", emoji: "🥛" },
  { type: "nut-free", label: "Nut-Free", emoji: "🥜" },
  { type: "halal", label: "Halal", emoji: "☪️" },
  { type: "kosher", label: "Kosher", emoji: "✡️" },
];

export default function DietaryStep() {
  const { state, toggleDietary, nextStep } = useQuiz();
  const isNone = state.dietary.includes("none");
  const hasSelection = state.dietary.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
        Any dietary restrictions?
      </h2>
      <p className="text-muted-foreground text-center text-xs uppercase tracking-widest">
        Select all that apply
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
          ✅ No Restrictions
        </motion.button>
      </div>
      <Button
        onClick={nextStep}
        disabled={!hasSelection}
        size="lg"
        className="w-full max-w-xs mt-4 rounded-lg font-semibold tracking-wide"
      >
        Get my recommendations <Sparkles className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
}
