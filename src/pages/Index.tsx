import { motion } from "framer-motion";
import { Camera, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizProvider } from "@/components/quiz/QuizContext";
import QuizFlow from "@/components/quiz/QuizFlow";
import { useState } from "react";

const Index = () => {
  const [mode, setMode] = useState<"welcome" | "quiz" | "scan">("welcome");

  if (mode === "quiz") {
    return (
      <QuizProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <header className="pt-6 pb-2 px-4 text-center">
            <button onClick={() => setMode("welcome")} className="inline-block">
              <h1 className="text-xl font-display font-bold text-primary">
                What Can I Eat?
              </h1>
            </button>
          </header>
          <main className="flex-1 flex items-start justify-center pt-4 pb-8">
            <QuizFlow />
          </main>
        </div>
      </QuizProvider>
    );
  }

  if (mode === "scan") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-display font-bold text-primary mb-6">What Can I Eat?</h1>
        <div className="bg-card rounded-2xl border border-border p-8 text-center max-w-sm w-full shadow-sm">
          <Camera className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2 text-foreground">Fridge Scanner</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Take a photo of your fridge or cupboard and get recipe ideas based on what you have!
          </p>
          <p className="text-xs text-muted-foreground">Coming soon — requires Lovable Cloud</p>
        </div>
        <Button variant="ghost" onClick={() => setMode("welcome")} className="mt-6 text-muted-foreground">
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-display font-black text-foreground mb-3 leading-tight">
          What Can<br />
          <span className="text-primary">I Eat?</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xs mx-auto">
          Let us help you figure out your next delicious bite
        </p>
      </motion.div>

      {/* Action cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setMode("quiz")}
            className="w-full bg-primary text-primary-foreground rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-3 bg-white/20 rounded-xl">
              <Utensils className="w-7 h-7" />
            </div>
            <div className="text-left">
              <span className="text-lg font-display font-bold block">What am I craving?</span>
              <span className="text-sm opacity-80">Answer a few quick questions</span>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button
            onClick={() => setMode("scan")}
            className="w-full bg-secondary text-secondary-foreground rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-3 bg-white/20 rounded-xl">
              <Camera className="w-7 h-7" />
            </div>
            <div className="text-left">
              <span className="text-lg font-display font-bold block">Scan my fridge</span>
              <span className="text-sm opacity-80">Get recipes from what you have</span>
            </div>
          </button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-muted-foreground mt-12"
      >
        No brands. No ads. Just food ideas.
      </motion.p>
    </div>
  );
};

export default Index;
