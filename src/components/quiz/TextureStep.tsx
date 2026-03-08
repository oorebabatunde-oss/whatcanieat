import { motion } from "framer-motion";
import { useQuiz, TextureProfile } from "./QuizContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function TextureStep() {
  const { state, toggleTexture, nextStep } = useQuiz();
  const { t } = useI18n();
  const isUnknown = state.textures.includes("unknown");
  const hasSelection = state.textures.length > 0;

  const textures: { type: TextureProfile; label: string; emoji: string }[] = [
    { type: "crunchy", label: t("quiz.texture.crunchy"), emoji: "🥨" },
    { type: "chewy", label: t("quiz.texture.chewy"), emoji: "🍬" },
    { type: "mushy", label: t("quiz.texture.mushy"), emoji: "🍌" },
    { type: "gooey", label: t("quiz.texture.gooey"), emoji: "🧀" },
    { type: "crispy", label: t("quiz.texture.crispy"), emoji: "🥓" },
    { type: "creamy", label: t("quiz.texture.creamy"), emoji: "🍦" },
    { type: "smooth", label: t("quiz.texture.smooth"), emoji: "🍫" },
    { type: "soupy", label: t("quiz.texture.soupy"), emoji: "🍜" },
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
        {t("quiz.texture.title")}
      </h2>
      <p className="text-muted-foreground text-center text-xs uppercase tracking-widest">
        {t("quiz.texture.subtitle")}
      </p>
      <div className="flex flex-wrap justify-center gap-3 w-full">
        {textures.map((tx, i) => {
          const selected = state.textures.includes(tx.type);
          return (
            <motion.button
              key={tx.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTexture(tx.type)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
                selected
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-card text-foreground border border-border hover:border-primary/30"
              }`}
            >
              {tx.label}
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleTexture("unknown")}
          className={`rounded-lg px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
            isUnknown
              ? "bg-[hsl(var(--mystery))] text-[hsl(var(--mystery-foreground))] shadow-lg"
              : "bg-card text-foreground border border-border hover:border-accent/30"
          }`}
        >
          🤷 {t("quiz.texture.unknown")}
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
