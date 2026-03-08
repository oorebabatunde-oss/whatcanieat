import { motion } from "framer-motion";
import { useQuiz, CravingType } from "./QuizContext";

const options: { type: CravingType; label: string; emoji: string; bg: string }[] = [
  { type: "snack", label: "A Snack", emoji: "🍿", bg: "bg-snack" },
  { type: "meal", label: "A Meal", emoji: "🥘", bg: "bg-meal" },
  { type: "unknown", label: "I Don't Know", emoji: "🤷", bg: "bg-[hsl(var(--mystery))]" },
];

export default function CravingStep() {
  const { state, setCraving, nextStep } = useQuiz();

  const handleSelect = (type: CravingType) => {
    setCraving(type);
    setTimeout(nextStep, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground">
        What are you craving?
      </h2>
      <p className="text-muted-foreground text-center text-sm">
        Pick one to get started
      </p>
      <div className="flex flex-col gap-4 w-full">
        {options.map((opt, i) => (
          <motion.button
            key={opt.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(opt.type)}
            className={`${opt.bg} text-primary-foreground rounded-lg p-5 flex items-center gap-4 shadow-lg hover:shadow-xl transition-shadow text-left w-full ${
              state.craving === opt.type ? "ring-4 ring-foreground/20" : ""
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className="text-xl font-display font-bold">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
