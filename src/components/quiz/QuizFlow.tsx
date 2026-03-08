import { useQuiz } from "./QuizContext";
import { AnimatePresence } from "framer-motion";
import CravingStep from "./CravingStep";
import FlavorStep from "./FlavorStep";
import TextureStep from "./TextureStep";
import DietaryStep from "./DietaryStep";
import ContextStep from "./ContextStep";
import ResultsScreen from "./ResultsScreen";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const stepLabels = ["Craving", "Flavour", "Texture", "Dietary", "Context", "Results"];

export default function QuizFlow() {
  const { state, prevStep } = useQuiz();
  const progress = ((state.step + 1) / stepLabels.length) * 100;

  return (
    <div className="w-full min-h-[60vh] flex flex-col">
      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto px-6 mb-2">
        <div className="flex items-center gap-3 mb-2">
          {state.step > 0 && state.step < 5 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={prevStep}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          <div className="flex-1">
            <Progress value={progress} className="h-2 rounded-full" />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 flex items-center justify-center py-6">
        <AnimatePresence mode="wait" initial={false}>
          {state.step === 0 && <CravingStep key="craving" />}
          {state.step === 1 && <FlavorStep key="flavor" />}
          {state.step === 2 && <TextureStep key="texture" />}
          {state.step === 3 && <DietaryStep key="dietary" />}
          {state.step === 4 && <ContextStep key="context" />}
          {state.step === 5 && <ResultsScreen key="results" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
