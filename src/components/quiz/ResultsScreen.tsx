import { useQuiz } from "./QuizContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw, AlertCircle, MapPin, ChefHat, ThumbsDown, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

interface Recommendation {
  name: string;
  description: string;
  cuisine: string;
  imageQuery: string;
}

export default function ResultsScreen() {
  const { state, reset } = useQuiz();
  const { t, lang } = useI18n();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageCredits, setImageCredits] = useState<Record<string, { name: string; link: string; source?: string }>>({});
  const [showRefine, setShowRefine] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const locale = lang || navigator.language || "en-US";
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

        const { data, error: fnError } = await supabase.functions.invoke("recommend", {
          body: {
            craving: state.craving,
            flavors: state.flavors,
            textures: state.textures,
            dietary: state.dietary,
            locale,
            timezone,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        setRecommendations(data.recommendations ?? []);

        const recs: Recommendation[] = data.recommendations ?? [];
        recs.forEach(async (rec: Recommendation) => {
          try {
            const { data: imgData } = await supabase.functions.invoke("unsplash-image", {
              body: { query: rec.imageQuery },
            });
            if (imgData?.imageUrl) {
              setImageUrls((prev) => ({ ...prev, [rec.name]: imgData.imageUrl }));
            }
            if (imgData?.credit?.name) {
              setImageCredits((prev) => ({ ...prev, [rec.name]: imgData.credit }));
            }
          } catch {}
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [state.craving, state.flavors, state.textures, state.dietary]);

  const handleDismiss = (index: number) => {
    setRecommendations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRefineSearch = async () => {
    if (!refineFeedback.trim()) return;
    setRefining(true);
    setError(null);
    try {
      const locale = lang || navigator.language || "en-US";
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const rejected = recommendations.map((r) => r.name);

      const { data, error: fnError } = await supabase.functions.invoke("recommend", {
        body: {
          craving: state.craving,
          flavors: state.flavors,
          textures: state.textures,
          dietary: state.dietary,
          locale,
          timezone,
          feedback: refineFeedback,
          rejected,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const recs: Recommendation[] = data.recommendations ?? [];
      setRecommendations(recs);
      setImageLoaded({});
      setImageUrls({});
      setImageCredits({});
      setShowRefine(false);
      setRefineFeedback("");

      recs.forEach(async (rec) => {
        try {
          const { data: imgData } = await supabase.functions.invoke("unsplash-image", {
            body: { query: rec.imageQuery },
          });
          if (imgData?.imageUrl) setImageUrls((prev) => ({ ...prev, [rec.name]: imgData.imageUrl }));
          if (imgData?.credit?.name) setImageCredits((prev) => ({ ...prev, [rec.name]: imgData.credit }));
        } catch {}
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRefining(false);
    }
  };

  const handleHowToMake = (dishName: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(dishName + " recipe")}`, "_blank");
  };

  const handleWhereToBuy = (dishName: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(dishName + " near me")}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-6 px-6 w-full max-w-sm mx-auto"
    >
      {loading ? (
        <>
          <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
            {t("results.loading.title")}
          </h2>
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm text-center">
              {t("results.loading.subtitle")}
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
            {t("results.title")}
          </h2>
          <p className="text-muted-foreground text-xs text-center -mt-4 whitespace-pre-line">
            {t("results.subtitle")}
          </p>
          <div className="flex flex-col gap-4 w-full">
            <AnimatePresence>
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                >
                  <AspectRatio ratio={16 / 9} className="bg-muted relative">
                    {!imageLoaded[rec.name] && (
                      <Skeleton className="absolute inset-0 w-full h-full" />
                    )}
                    {imageUrls[rec.name] && (
                      <img
                        src={imageUrls[rec.name]}
                        alt={rec.name}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          imageLoaded[rec.name] ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImageLoaded((prev) => ({ ...prev, [rec.name]: true }))}
                      />
                    )}
                    {imageCredits[rec.name] && imageLoaded[rec.name] && imageCredits[rec.name].source !== "AI" && (
                      <div className="absolute bottom-0 right-0 px-2 py-0.5 bg-black/50 rounded-tl text-[10px] text-white/80">
                        Photo by{" "}
                        <a
                          href={`${imageCredits[rec.name].link}${imageCredits[rec.name].source === "Unsplash" ? "?utm_source=your_app&utm_medium=referral" : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {imageCredits[rec.name].name}
                        </a>
                        {imageCredits[rec.name].source === "Unsplash" && (
                          <>
                            {" / "}
                            <a
                              href="https://unsplash.com/?utm_source=your_app&utm_medium=referral"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Unsplash
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </AspectRatio>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground text-base">
                          {rec.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {rec.cuisine}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDismiss(i)}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{rec.description}</p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 flex-1"
                        onClick={() => handleWhereToBuy(rec.name)}
                      >
                        <MapPin className="w-3.5 h-3.5" /> {t("results.whereToBuy")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 flex-1"
                        onClick={() => handleHowToMake(rec.name)}
                      >
                        <ChefHat className="w-3.5 h-3.5" /> {t("results.howToMake")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
      {!loading && !error && (
        <div className="flex flex-col items-center gap-3 w-full mt-4">
          {!showRefine ? (
            <Button
              variant="outline"
              onClick={() => setShowRefine(true)}
              className="rounded-full gap-2"
            >
              <XCircle className="w-4 h-4" /> {t("results.dismiss")}
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="w-full space-y-3"
            >
              <Textarea
                placeholder={t("results.refinePlaceholder")}
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                className="resize-none text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowRefine(false); setRefineFeedback(""); }}
                  className="flex-1"
                >
                  {t("results.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRefineSearch}
                  disabled={!refineFeedback.trim() || refining}
                  className="flex-1 gap-1.5"
                >
                  {refining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {t("results.refineSearch")}
                </Button>
              </div>
            </motion.div>
          )}
          <Button variant="ghost" onClick={reset} className="rounded-full gap-2 text-muted-foreground">
            <RotateCcw className="w-4 h-4" /> {t("results.startOver")}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
