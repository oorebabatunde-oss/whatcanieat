import { motion } from "framer-motion";
import { useQuiz, CravingType } from "./QuizContext";

const options: { type: CravingType; label: string; emoji: string }[] = [
  { type: "snack", label: "A Snack", emoji: "🍿" },
  { type: "meal", label: "A Meal", emoji: "🥘" },
  { type: "unknown", label: "Surprise Me", emoji: "✨" },
];

export default function CravingStep() {
  const { state, setCraving, nextStep } = useQuiz();

  const handleSelect = (type: CravingType) => {
    setCraving(type);
    setTimeout(nextStep, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
        What are you craving?
      </h2>
      <p className="text-muted-foreground text-center text-xs uppercase tracking-widest">
        Pick one to get started
      </p>
      <div className="flex flex-row gap-3 w-full">
        {options.map((opt, i) => (
          <motion.button
            key={opt.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(opt.type)}
            className={`flex-1 bg-[hsl(var(--primary))] text-primary-foreground rounded-lg p-4 flex flex-col items-center gap-2 shadow-md hover:shadow-lg transition-all ${
              state.craving === opt.type ? "ring-2 ring-foreground/20" : ""
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-sm font-semibold">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
