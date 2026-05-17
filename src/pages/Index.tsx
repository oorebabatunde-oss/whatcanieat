import { motion } from "framer-motion";
import { QuizProvider } from "@/components/quiz/QuizContext";
import QuizFlow from "@/components/quiz/QuizFlow";
import FridgeScanner from "@/components/scan/FridgeScanner";
import MealPlanFlow from "@/components/mealplan/MealPlanFlow";
import FlowHeader from "@/components/FlowHeader";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import SeoHead from "@/components/SeoHead";

type AppMode = "welcome" | "quiz" | "scan" | "mealplan";
const MODE_KEY = "app-mode";

function loadMode(): AppMode {
  try {
    const stored = sessionStorage.getItem(MODE_KEY);
    if (stored === "quiz" || stored === "scan" || stored === "mealplan") return stored;
  } catch {}
  return "welcome";
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>(loadMode);
  const { t } = useI18n();

  const changeMode = (m: AppMode) => {
    if (m === "quiz") {
      sessionStorage.removeItem("quiz-state");
    }
    sessionStorage.setItem(MODE_KEY, m);
    setMode(m);
  };

  const goWelcome = () => {
    sessionStorage.removeItem("quiz-state");
    changeMode("welcome");
  };

  const seo = {
    welcome: {
      title: "What Can I Eat? — Food Recommendations & Meal Ideas",
      description: "Figure out what you want to eat now with 3 steps, scan your fridge for recipe ideas, or plan meals ahead. No brands, no ads — just food.",
      path: "/",
    },
    quiz: {
      title: "Craving Quiz — What Can I Eat?",
      description: "Answer a few quick questions about your mood, cravings, and dietary needs to get personalized dish recommendations.",
      path: "/",
    },
    scan: {
      title: "Scan Your Fridge — What Can I Eat?",
      description: "Snap a photo of your fridge or pantry and get recipe ideas based on the ingredients you already have at home.",
      path: "/",
    },
    mealplan: {
      title: "Meal Planner — What Can I Eat?",
      description: "Build a personalized meal plan from 1 to 30 days, tailored to your diet, preferences, and any medical considerations.",
      path: "/",
    },
  }[mode];

  const seoHead = <SeoHead title={seo.title} description={seo.description} path={seo.path} />;

  if (mode === "quiz") {
    return (
      <QuizProvider>
        {seoHead}
        <div className="min-h-screen bg-background flex flex-col">
          <FlowHeader title={t("quiz.headerTitle")} onBack={goWelcome} />
          <main className="flex-1 flex items-start justify-center pt-4 pb-4">
            <QuizFlow />
          </main>
        </div>
      </QuizProvider>
    );
  }

  if (mode === "scan") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {seoHead}
        <FridgeScanner onBack={goWelcome} />
      </div>
    );
  }

  if (mode === "mealplan") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {seoHead}
        <FlowHeader title={t("mealplan.headerTitle")} onBack={goWelcome} />
        <main className="flex-1 flex items-start justify-center pt-4 pb-4">
          <MealPlanFlow />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 relative overflow-hidden">
      {seoHead}

      <div className="relative z-10 w-full flex flex-col items-center flex-1">

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-10">
            <h1 className="text-display-1 md:text-5xl font-bold text-foreground mb-2 leading-tight" style={{ fontFamily: "'Playpen Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              {t("app.title")}
            </h1>
            <p className="text-muted-foreground text-body-sm">
              {t("home.subtitle")}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 w-full max-w-[28rem]">
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => changeMode("quiz")}
              className="group glass-card rounded-xl px-4 py-4 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md flex-1 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 will-change-transform"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🍽️</span>
              <span className="text-sm font-semibold leading-snug text-foreground">{t("home.findCraving")}</span>
              <span className="text-body-xs text-muted-foreground font-normal leading-tight">{t("home.findCravingSubtext")}</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => changeMode("scan")}
              className="group glass-card rounded-xl px-4 py-4 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md flex-1 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 will-change-transform"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🥘</span>
              <span className="text-sm font-semibold leading-snug text-foreground">{t("home.scanFridge")}</span>
              <span className="text-body-xs text-muted-foreground font-normal leading-tight">{t("home.scanFridgeSubtext")}</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => changeMode("mealplan")}
              className="group glass-card rounded-xl px-4 py-4 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md flex-1 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 will-change-transform"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">📋</span>
              <span className="text-sm font-semibold leading-snug text-foreground">{t("home.planMeals")}</span>
              <span className="text-body-xs text-muted-foreground font-normal leading-tight">{t("home.planMealsSubtext")}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
