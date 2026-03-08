import { motion } from "framer-motion";
import { useQuiz, TextureProfile } from "./QuizContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const textures: { type: TextureProfile; label: string; emoji: string }[] = [
  { type: "crunchy", label: "Crunchy", emoji: "🥨" },
  { type: "chewy", label: "Chewy", emoji: "🍬" },
  { type: "mushy", label: "Mushy", emoji: "🍌" },
  { type: "gooey", label: "Gooey", emoji: "🧀" },
  { type: "crispy", label: "Crispy", emoji: "🥓" },
  { type: "creamy", label: "Creamy", emoji: "🍦" },
  { type: "smooth", label: "Smooth", emoji: "🍫" },
  { type: "soupy", label: "Soupy", emoji: "🍜" },
];

export default function TextureStep() {
  const { state, toggleTexture, nextStep } = useQuiz();
  const isUnknown = state.textures.includes("unknown");
  const hasSelection = state.textures.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
        What texture are you feeling?
      </h2>
      <p className="text-muted-foreground text-center text-xs uppercase tracking-widest">
        Pick as many as you like
      </p>
      <div className="flex flex-wrap justify-center gap-3 w-full">
        {textures.map((t, i) => {
          const selected = state.textures.includes(t.type);
          return (
            <motion.button
              key={t.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTexture(t.type)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
                selected
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-card text-foreground border border-border hover:border-primary/30"
              }`}
            >
              
              {t.label}
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
          🤷 I Don't Know
        </motion.button>
      </div>
      <Button
        onClick={nextStep}
        disabled={!hasSelection}
        size="lg"
        className="w-full max-w-xs mt-4 rounded-lg font-semibold tracking-wide"
      >
        Next <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
}
