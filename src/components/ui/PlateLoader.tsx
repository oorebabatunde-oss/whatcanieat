import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const FOODS = ["🥗", "🍕", "🍜", "🧁", "🥑", "🍔", "🌮", "🥘", "🍣", "🍝", "🥙", "🍛"];

interface PlateLoaderProps {
  message?: string;
}

export default function PlateLoader({ message }: PlateLoaderProps) {
  const { t } = useI18n();
  const [foodIndex, setFoodIndex] = useState(0);
  const [delayPhase, setDelayPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFoodIndex((prev) => (prev + 1) % FOODS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setDelayPhase(1), 5000);
    const t2 = setTimeout(() => setDelayPhase(2), 15000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative flex flex-col items-center" style={{ height: 120 }}>
        {/* Food emoji cycling above plate */}
        <AnimatePresence mode="wait">
          <motion.span
            key={foodIndex}
            initial={{ opacity: 0, scale: 0.3, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-5xl absolute top-0"
          >
            {FOODS[foodIndex]}
          </motion.span>
        </AnimatePresence>

        {/* Plate emoji */}
        <span className="text-6xl mt-auto">🍽️</span>
      </div>

      {message && (
        <p className="text-muted-foreground text-sm text-center">{message}</p>
      )}

      <AnimatePresence>
        {showAlmost && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-muted-foreground/70 text-xs text-center italic"
          >
            {t("loading.almostThere")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
