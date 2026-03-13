import { motion } from "framer-motion";
import { useQuiz } from "./QuizContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, SkipForward } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ContextStep() {
  const { state, setContext, nextStep } = useQuiz();
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-6 px-5 w-full max-w-md mx-auto"
    >
      <h2 className="text-display-2 md:text-display-1 font-display text-center text-foreground">
        {t("quiz.context.title")}
      </h2>
      <p className="text-muted-foreground text-center text-body-xs tracking-wide">
        {t("quiz.context.subtitle")}
      </p>

      <Textarea
        value={state.context}
        onChange={(e) => setContext(e.target.value)}
        placeholder={t("quiz.context.placeholder")}
        className="w-full min-h-[100px] bg-card text-foreground placeholder:text-muted-foreground resize-none rounded-xl"
        maxLength={200}
      />

      <Button
        onClick={nextStep}
        disabled={!(state.context || "").trim()}
        size="lg"
        className="w-full max-w-xs rounded-xl font-medium"
      >
        {t("quiz.dietary.submit")} <Sparkles className="w-5 h-5 ml-1" />
      </Button>

      <Button
        variant="outline"
        onClick={nextStep}
        size="lg"
        className="w-full max-w-xs rounded-xl font-medium gap-1.5"
      >
        <SkipForward className="w-4 h-4" /> {t("quiz.context.skip")}
      </Button>
    </motion.div>
  );
}
