import { useQuiz } from "./QuizContext";
import { motion } from "framer-motion";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultsScreen() {
  const { state, reset } = useQuiz();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground">
        Finding your perfect food...
      </h2>
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm text-center">
          Looking for {state.craving === "snack" ? "snacks" : state.craving === "meal" ? "meals" : "something tasty"}
          {state.flavors.length > 0 && !state.flavors.includes("unknown") && (
            <> that are {state.flavors.join(", ")}</>
          )}
          {state.textures.length > 0 && !state.textures.includes("unknown") && (
            <> and {state.textures.join(", ")}</>
          )}
        </p>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        AI recommendations coming soon — connect Lovable Cloud to enable
      </p>
      <Button variant="outline" onClick={reset} className="rounded-full gap-2 mt-4">
        <RotateCcw className="w-4 h-4" /> Start Over
      </Button>
    </motion.div>
  );
}
