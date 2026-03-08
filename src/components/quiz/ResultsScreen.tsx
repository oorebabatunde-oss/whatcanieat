import { useQuiz } from "./QuizContext";
import { motion } from "framer-motion";
import { Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  name: string;
  description: string;
  emoji: string;
}

export default function ResultsScreen() {
  const { state, reset } = useQuiz();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("recommend", {
          body: {
            craving: state.craving,
            flavors: state.flavors,
            textures: state.textures,
            dietary: state.dietary,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        setRecommendations(data.recommendations ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [state.craving, state.flavors, state.textures, state.dietary]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-6 px-4 w-full max-w-md mx-auto"
    >
      {loading ? (
        <>
          <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
            Finding your perfect food...
          </h2>
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm text-center">
              Our AI chef is thinking...
            </p>
          </div>
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-destructive text-sm text-center">{error}</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
            Here's what you should eat!
          </h2>
          <div className="flex flex-col gap-3 w-full">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 shadow-sm"
              >
                <span className="text-3xl">{rec.emoji}</span>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{rec.name}</h3>
                  <p className="text-muted-foreground text-sm">{rec.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
      <Button variant="outline" onClick={reset} className="rounded-full gap-2 mt-4">
        <RotateCcw className="w-4 h-4" /> Start Over
      </Button>
    </motion.div>
  );
}
