import { useQuiz } from "./QuizContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw, AlertCircle, Heart, X, XCircle, Send, BookmarkCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import SwipeCard from "./SwipeCard";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

interface Recommendation {
  name: string;
  description: string;
  cuisine: string;
  imageQuery: string;
}

export default function ResultsScreen() {
  const { state, reset } = useQuiz();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageCredits, setImageCredits] = useState<Record<string, { name: string; link: string; source?: string }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRefine, setShowRefine] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [refining, setRefining] = useState(false);
  const [allSwiped, setAllSwiped] = useState(false);

  const fetchImages = (recs: Recommendation[]) => {
    recs.forEach(async (rec) => {
      try {
        const { data: imgData } = await supabase.functions.invoke("unsplash-image", {
          body: { query: rec.imageQuery },
        });
        if (imgData?.imageUrl) setImageUrls((prev) => ({ ...prev, [rec.name]: imgData.imageUrl }));
        if (imgData?.credit?.name) setImageCredits((prev) => ({ ...prev, [rec.name]: imgData.credit }));
      } catch {}
    });
  };

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
            context: state.context || undefined,
            locale,
            timezone,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        const recs: Recommendation[] = data.recommendations ?? [];
        setRecommendations(recs);
        setCurrentIndex(0);
        setAllSwiped(false);
        fetchImages(recs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [state.craving, state.flavors, state.textures, state.dietary, state.context]);

  const handleSwipeRight = async (rec: Recommendation) => {
    if (user) {
      await supabase.from("saved_recommendations").insert({
        user_id: user.id,
        name: rec.name,
        description: rec.description,
        cuisine: rec.cuisine,
        image_query: rec.imageQuery,
      });
      toast.success(t("results.saved"));
    } else {
      toast(t("results.loginToSave"), {
        action: {
          label: t("auth.title"),
          onClick: () => navigate("/auth"),
        },
      });
    }
    advance();
  };

  const handleSwipeLeft = () => {
    advance();
  };

  const advance = () => {
    const next = currentIndex + 1;
    if (next >= recommendations.length) {
      setAllSwiped(true);
    } else {
      setCurrentIndex(next);
    }
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
      setCurrentIndex(0);
      setAllSwiped(false);
      setImageLoaded({});
      setImageUrls({});
      setImageCredits({});
      setShowRefine(false);
      setRefineFeedback("");
      fetchImages(recs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRefining(false);
    }
  };

  const visibleCards = recommendations.slice(currentIndex, currentIndex + 2);

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
      ) : allSwiped ? (
        <>
          <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
            {t("results.allDone")}
          </h2>
          <p className="text-muted-foreground text-sm text-center">
            {t("results.allDoneSubtitle")}
          </p>

          {!showRefine ? (
            <div className="flex flex-col items-center gap-3 w-full">
              {user && (
                <Link to="/saved">
                  <Button variant="default" className="rounded-full gap-2">
                    <BookmarkCheck className="w-4 h-4" /> {t("results.viewSaved")}
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => setShowRefine(true)}
                className="rounded-full gap-2"
              >
                <XCircle className="w-4 h-4" /> {t("results.dismiss")}
              </Button>
              <Button variant="ghost" onClick={reset} className="rounded-full gap-2 text-muted-foreground">
                <RotateCcw className="w-4 h-4" /> {t("results.startOver")}
              </Button>
            </div>
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
              <Button variant="ghost" onClick={reset} className="rounded-full gap-2 text-muted-foreground w-full">
                <RotateCcw className="w-4 h-4" /> {t("results.startOver")}
              </Button>
            </motion.div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl font-display text-center text-foreground">
            {t("results.title")}
          </h2>
          <p className="text-muted-foreground text-xs text-center -mt-4 whitespace-pre-line">
            {t("results.swipeHint")}
          </p>
          <p className="text-muted-foreground/70 text-[10px] text-center -mt-4 whitespace-pre-line italic">
            {t("results.subtitle")}
          </p>

          {/* Card stack */}
          <div className="relative w-full" style={{ height: 520 }}>
            <AnimatePresence>
              {visibleCards.map((rec, i) => (
                <SwipeCard
                  key={rec.name + currentIndex + i}
                  rec={rec}
                  imageUrl={imageUrls[rec.name]}
                  imageLoaded={!!imageLoaded[rec.name]}
                  imageCredit={imageCredits[rec.name]}
                  onImageLoad={() => setImageLoaded((prev) => ({ ...prev, [rec.name]: true }))}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={() => handleSwipeRight(rec)}
                  isTop={i === 0}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-6 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleSwipeLeft}
            >
              <X className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleSwipeRight(recommendations[currentIndex])}
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            {currentIndex + 1} / {recommendations.length}
          </p>
        </>
      )}
    </motion.div>
  );
}
