import { motion } from "framer-motion";
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
              <h1 className="text-xl font-display text-primary">
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
        <h1 className="text-xl font-display text-primary mb-6">What Can I Eat?</h1>
        <div className="bg-card rounded-lg border border-border p-8 text-center max-w-sm w-full shadow-sm">
          <span className="text-3xl block mb-4">📷</span>
          <h2 className="text-xl font-display mb-2 text-foreground">Fridge Scanner</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Take a photo of your fridge or cupboard and get recipe ideas based on what you have!
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Coming soon</p>
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
        className="text-center mb-14"
      >
        <h1 className="text-5xl md:text-6xl font-display text-foreground mb-4 leading-tight">
          What Can<br />
          <span className="text-primary">I Eat?</span>
        </h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-xs mx-auto">
          Let us help you figure out your next delicious bite
        </p>
      </motion.div>

      {/* Action cards */}
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode("quiz")}
          className="w-full bg-[hsl(var(--primary))] text-primary-foreground rounded-lg px-6 py-3 flex items-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
        >
          <span className="text-2xl">🍽️</span>
          <span className="text-sm font-semibold tracking-wide">Find what I'm craving</span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode("scan")}
          className="w-full bg-[hsl(var(--primary))] text-primary-foreground rounded-lg px-6 py-3 flex items-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
        >
          <span className="text-2xl">📱</span>
          <span className="text-sm font-semibold tracking-wide">Scan my fridge or cupboard</span>
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-muted-foreground mt-14 uppercase tracking-widest"
      >
        No brands · No ads · Just food ideas
      </motion.p>
    </div>
  );
};

export default Index;
