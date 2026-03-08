import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuizProvider } from "@/components/quiz/QuizContext";
import QuizFlow from "@/components/quiz/QuizFlow";
import FridgeScanner from "@/components/scan/FridgeScanner";
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
      </QuizProvider>);

  }

  if (mode === "scan") {
    return <FridgeScanner onBack={() => setMode("welcome")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14">
        
        <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-4 leading-tight">
          What Can<br />
          <span className="text-primary">I Eat?</span>
        </h1>
        

        
      </motion.div>

      {/* Action cards */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode("quiz")}
          className="bg-[hsl(var(--primary))] text-primary-foreground rounded-lg px-6 py-3 flex items-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]">

          <span className="text-2xl">🍽️</span>
          <span className="text-sm font-semibold tracking-wide">Find what I'm craving</span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode("scan")}
          className="bg-[hsl(var(--primary))] text-primary-foreground rounded-lg px-6 py-3 flex items-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]">
          
          <span className="text-2xl">📱</span>
          <span className="text-sm font-semibold tracking-wide">Scan my fridge or cupboard</span>
        </motion.button>
      </div>

      






      
    </div>);

};

export default Index;