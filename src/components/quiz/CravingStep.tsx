import { motion } from "framer-motion";
import { useQuiz, CravingType } from "./QuizContext";
import { useI18n } from "@/lib/i18n";

export default function CravingStep() {
  const { state, setCraving, nextStep } = useQuiz();
  const { t } = useI18n();

  const options: { type: CravingType; label: string; emoji: string }[] = [
    { type: "snack", label: t("quiz.craving.snack"), emoji: "🍿" },
    { type: "meal", label: t("quiz.craving.meal"), emoji: "🥘" },
    { type: "unknown", label: t("quiz.craving.unknown"), emoji: "✨" },
  ];

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
        {t("quiz.craving.title")}
      </h2>
      <p className="text-muted-foreground text-center text-xs uppercase tracking-widest">
        {t("quiz.craving.subtitle")}
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
            className={`flex-1 bg-primary text-primary-foreground rounded-lg p-4 flex flex-col items-center gap-2 shadow-md hover:shadow-lg ${
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
