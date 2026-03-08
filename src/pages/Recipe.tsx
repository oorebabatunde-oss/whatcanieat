import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Users, Loader2, AlertCircle, RotateCcw } from "lucide-react";

interface RecipeData {
  name: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  steps: string[];
  tips?: string;
}

export default function Recipe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dish = searchParams.get("dish") || "";

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("recipe", {
        body: { dish },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setRecipe(data.recipe);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dish) fetchRecipe();
  }, [dish]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-semibold text-foreground text-lg">
            {dish || "Recipe"}
          </h1>
          <p className="text-muted-foreground text-xs">AI-generated recipe</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Generating recipe...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive text-sm text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRecipe} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Try again
            </Button>
          </div>
        )}

        {recipe && (
          <div className="space-y-6">
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {recipe.prepTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Prep: {recipe.prepTime}</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Cook: {recipe.cookTime}</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Serves {recipe.servings}</span>
                </div>
              )}
            </div>

            {/* Ingredients */}
            <div>
              <h2 className="font-display font-semibold text-foreground text-lg mb-3">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div>
              <h2 className="font-display font-semibold text-foreground text-lg mb-3">Instructions</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-foreground pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {recipe.tips && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">💡 Tip:</strong> {recipe.tips}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
