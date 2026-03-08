import { useQuiz } from "./QuizContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw, AlertCircle, MapPin, ChefHat, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface Recommendation {
  name: string;
  description: string;
  cuisine: string;
  imageQuery: string;
}

export default function ResultsScreen() {
  const { state, reset } = useQuiz();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageCredits, setImageCredits] = useState<Record<number, { name: string; link: string; source?: string }>>({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const locale = navigator.language || "en-US";
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

        // Fetch Unsplash images for each recommendation
        const recs: Recommendation[] = data.recommendations ?? [];
        recs.forEach(async (rec: Recommendation, i: number) => {
          try {
            const { data: imgData } = await supabase.functions.invoke("unsplash-image", {
              body: { query: rec.imageQuery },
            });
            if (imgData?.imageUrl) {
              setImageUrls((prev) => ({ ...prev, [i]: imgData.imageUrl }));
            }
            if (imgData?.credit?.name) {
              setImageCredits((prev) => ({ ...prev, [i]: imgData.credit }));
            }
          } catch {
            // fallback: no image
          }
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

  const handleHowToMake = (dishName: string) => {
    const q = encodeURIComponent(`how to make ${dishName} recipe`);
    window.open(`https://www.google.com/search?q=${q}`, "_blank");
  };

  const handleWhereToBuy = (dishName: string) => {
    navigate(`/where-to-buy?dish=${encodeURIComponent(dishName)}`);
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
            Finding your perfect food...
          </h2>
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm text-center">
              Finding recommendations...
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
            Here's what you could eat!
          </h2>
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
                    {!imageLoaded[i] && (
                      <Skeleton className="absolute inset-0 w-full h-full" />
                    )}
                    {imageUrls[i] && (
                      <img
                        src={imageUrls[i]}
                        alt={rec.name}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          imageLoaded[i] ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImageLoaded((prev) => ({ ...prev, [i]: true }))}
                      />
                    )}
                    {imageCredits[i] && imageLoaded[i] && (
                      <div className="absolute bottom-0 right-0 px-2 py-0.5 bg-black/50 rounded-tl text-[10px] text-white/80">
                        Photo by{" "}
                        <a
                          href={`${imageCredits[i].link}${imageCredits[i].source === "Unsplash" ? "?utm_source=your_app&utm_medium=referral" : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {imageCredits[i].name}
                        </a>
                        {imageCredits[i].source === "Unsplash" && (
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
                        {imageCredits[i].source === "Wikipedia" && " / Wikipedia"}
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
                        <MapPin className="w-3.5 h-3.5" /> Where to buy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 flex-1"
                        onClick={() => handleHowToMake(rec.name)}
                      >
                        <ChefHat className="w-3.5 h-3.5" /> How to make
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
      <Button variant="outline" onClick={reset} className="rounded-full gap-2 mt-4">
        <RotateCcw className="w-4 h-4" /> Start Over
      </Button>
    </motion.div>
  );
}
