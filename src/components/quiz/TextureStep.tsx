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
      className="flex flex-col items-center gap-6 px-5 w-full max-w-md mx-auto"
    >
      <h2 className="text-display-2 md:text-display-1 font-display text-center text-foreground">
        {t("quiz.texture.title")}
      </h2>
      <p className="text-muted-foreground text-center text-body-xs tracking-wide">
        {t("quiz.texture.subtitle")}
      </p>
      <div className="flex flex-wrap justify-center gap-2.5 w-full">
        {textures.map((tx, i) => {
          const selected = state.textures.includes(tx.type);
          return (
            <motion.button
              key={tx.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}

              onClick={() => toggleTexture(tx.type)}
              className={`rounded-xl px-4 min-h-[44px] text-sm font-medium flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-foreground shadow-sm hover:shadow-md"
              }`}
            >
              {tx.label}
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}

          onClick={() => toggleTexture("unknown")}
          className={`rounded-xl px-4 min-h-[44px] text-sm font-medium flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isUnknown
              ? "bg-[hsl(var(--mystery))] text-[hsl(var(--mystery-foreground))] shadow-md"
              : "bg-card text-foreground shadow-sm hover:shadow-md"
          }`}
        >
          🤷 {t("quiz.texture.unknown")}
        </motion.button>
      </div>
      <Button
        onClick={nextStep}
        disabled={!hasSelection}
        size="lg"
        className="w-full max-w-xs mt-4 rounded-xl font-medium"
      >
        {t("quiz.next")} <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
}
