import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SavedRecommendations from "@/components/saved/SavedRecommendations";
import SavedMealPlans from "@/components/saved/SavedMealPlans";
import SeoHead from "@/components/SeoHead";

export default function Saved() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Saved Dishes & Meal Plans — What Can I Eat?"
        description="View your saved dish recommendations and meal plans. Revisit favorites and pick up where you left off on What Can I Eat?."
        path="/saved"
      />
      <div className="max-w-sm mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => {
            sessionStorage.removeItem("quiz-state");
            sessionStorage.removeItem("app-mode");
            navigate("/");
          }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("saved.title")}
          </h1>
        </div>

        {/* Guest warning banner */}
        {!authLoading && !user && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                {t("saved.guestWarning")}
              </p>
            </div>
            <Link to="/auth">
              <Button size="sm" variant="outline" className="w-full text-xs">
                {t("saved.signInToKeep")}
              </Button>
            </Link>
          </div>
        )}

        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="recommendations" className="flex-1 text-xs">
              {t("saved.tabs.recommendations")}
            </TabsTrigger>
            <TabsTrigger value="mealplans" className="flex-1 text-xs">
              {t("saved.tabs.mealPlans")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <SavedRecommendations user={user} authLoading={authLoading} />
          </TabsContent>

          <TabsContent value="mealplans">
            <SavedMealPlans user={user} authLoading={authLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
