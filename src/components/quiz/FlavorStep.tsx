import { motion } from "framer-motion";
import { useQuiz, FlavorProfile } from "./QuizContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const flavors: { type: FlavorProfile; label: string; emoji: string; hue: string }[] = [
  { type: "salty", label: "Salty", emoji: "🧂", hue: "bg-[hsl(var(--salty))]" },
  { type: "sweet", label: "Sweet", emoji: "🍬", hue: "bg-[hsl(var(--sweet))]" },
  { type: "savoury", label: "Savoury", emoji: "🍖", hue: "bg-[hsl(var(--savoury))]" },
  { type: "spicy", label: "Spicy", emoji: "🌶️", hue: "bg-[hsl(var(--spicy))]" },
  { type: "sour", label: "Sour", emoji: "🍋", hue: "bg-[hsl(var(--sour))]" },
  { type: "umami", label: "Umami", emoji: "🍄", hue: "bg-[hsl(var(--umami))]" },
  { type: "bitter", label: "Bitter", emoji: "🍵", hue: "bg-[hsl(var(--bitter))]" },
];

export default function FlavorStep() {
  const { state, toggleFlavor, nextStep } = useQuiz();
  const isUnknown = state.flavors.includes("unknown");
  const hasSelection = state.flavors.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground">
        What flavours sound good?
      </h2>
      <p className="text-muted-foreground text-center text-sm">
        Pick as many as you like
      </p>
      <div className="flex flex-wrap justify-center gap-3 w-full">
        {flavors.map((f, i) => {
          const selected = state.flavors.includes(f.type);
          return (
            <motion.button
              key={f.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFlavor(f.type)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
                selected
                  ? `${f.hue} text-white shadow-lg scale-105`
                  : "bg-card text-foreground border border-border hover:border-primary/30"
              }`}
            >
              <span>{f.emoji}</span>
              {f.label}
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleFlavor("unknown")}
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
        className="w-full max-w-xs mt-4 rounded-lg font-display font-bold text-lg"
      >
        Next <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
}
