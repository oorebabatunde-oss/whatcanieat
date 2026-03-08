import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, ArrowLeft, ChefHat, Clock, BarChart3, ExternalLink, Youtube, ImageOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface Ingredient {
  name: string;
  category: string;
}

interface Recipe {
  name: string;
  description: string;
  usesIngredients: string[];
  difficulty: "easy" | "medium" | "hard";
  timeMinutes: number;
}

interface ScanResult {
  ingredients: Ingredient[];
  recipes: Recipe[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  produce: "🥬", dairy: "🧀", meat: "🥩", grain: "🌾",
  condiment: "🧂", beverage: "🥤", frozen: "🧊", other: "📦",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-green-500/10 text-green-700 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function FridgeScanner({ onBack }: { onBack: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target?.result as string); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-ingredients", { body: { imageBase64: preview } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setPreview(null); setResult(null); };

  const openRecipeSearch = (name: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(name + " recipe")}`, "_blank");
  };

  const openYouTube = (name: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(name + " recipe")}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="pt-6 pb-2 px-4 text-center">
        <button onClick={onBack} className="inline-block">
          <h1 className="text-xl font-display font-bold text-primary">{t("app.title")}</h1>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-8 pt-4 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-6 w-full">
              <h2 className="text-2xl font-display text-center text-foreground">{t("scan.title")}</h2>
              <p className="text-muted-foreground text-sm text-center -mt-4">{t("scan.subtitle")}</p>
              <div className="flex flex-col gap-3 w-full">
                <Button size="lg" className="gap-2 w-full" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="w-5 h-5" /> {t("scan.takePhoto")}
                </Button>
                <Button variant="outline" size="lg" className="gap-2 w-full" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-5 h-5" /> {t("scan.uploadImage")}
                </Button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button variant="ghost" onClick={onBack} className="text-muted-foreground gap-2">
                <ArrowLeft className="w-4 h-4" /> {t("scan.back")}
              </Button>
            </motion.div>
          ) : !result ? (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-4 w-full">
              <h2 className="text-2xl font-display text-center text-foreground">
                {loading ? t("scan.analyzing") : t("scan.ready")}
              </h2>
              <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
                <img src={preview} alt="Fridge contents" className="w-full h-auto max-h-64 object-cover" />
              </div>
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground text-sm">{t("scan.identifying")}</p>
                </div>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={handleReset} className="flex-1">{t("scan.retake")}</Button>
                  <Button onClick={handleScan} className="flex-1 gap-2">
                    <Camera className="w-4 h-4" /> {t("scan.scan")}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6 w-full">
              {result.ingredients.length === 0 && result.recipes.length === 0 ? (
                /* Empty state – scan found nothing */
                <div className="flex flex-col items-center gap-4 text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-display text-foreground">{t("scan.emptyTitle")}</h2>
                  <p className="text-muted-foreground text-sm max-w-xs">{t("scan.emptySubtitle")}</p>
                  <ul className="text-muted-foreground text-xs text-left space-y-1 mt-1">
                    <li>• {t("scan.tip1")}</li>
                    <li>• {t("scan.tip2")}</li>
                    <li>• {t("scan.tip3")}</li>
                  </ul>
                  <div className="flex flex-col items-center gap-2 mt-3 w-full">
                    <Button onClick={handleReset} className="gap-2 rounded-full w-full max-w-xs">
                      <RefreshCw className="w-4 h-4" /> {t("scan.tryAgain")}
                    </Button>
                    <Button variant="ghost" onClick={onBack} className="text-muted-foreground gap-2">
                      <ArrowLeft className="w-4 h-4" /> {t("scan.backHome")}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Normal results */
                <>
                  <div>
                    <h2 className="text-xl font-display text-foreground mb-3">
                      {t("scan.ingredientsFound")} ({result.ingredients.length})
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {result.ingredients.map((ing, i) => (
                        <Badge key={i} variant="secondary" className="text-sm py-1 px-2.5 gap-1">
                          {CATEGORY_EMOJI[ing.category] || "📦"} {ing.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-display text-foreground mb-3">{t("scan.recipeIdeas")}</h2>
                    <p className="text-muted-foreground text-xs -mt-2 mb-3">{t("scan.recipeSubtitle")}</p>
                    <div className="flex flex-col gap-3">
                      {result.recipes.map((recipe, i) => (
                        <motion.div key={recipe.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-display font-semibold text-foreground text-base">{recipe.name}</h3>
                            <Badge className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_COLOR[recipe.difficulty]}`}>{recipe.difficulty}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">{recipe.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.timeMinutes} min</span>
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {recipe.usesIngredients.length} ingredients</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {recipe.usesIngredients.map((ing) => (
                              <span key={ing} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ing}</span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs gap-1.5 flex-1" onClick={() => openRecipeSearch(recipe.name)}>
                              <ExternalLink className="w-3.5 h-3.5" /> {t("scan.recipe")}
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs gap-1.5 flex-1" onClick={() => openYouTube(recipe.name)}>
                              <Youtube className="w-3.5 h-3.5" /> {t("scan.video")}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 mt-2">
                    <Button variant="outline" onClick={handleReset} className="gap-2 rounded-full">
                      <Camera className="w-4 h-4" /> {t("scan.scanAgain")}
                    </Button>
                    <Button variant="ghost" onClick={onBack} className="text-muted-foreground gap-2">
                      <ArrowLeft className="w-4 h-4" /> {t("scan.backHome")}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
