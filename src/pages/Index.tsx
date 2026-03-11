import { motion } from "framer-motion";
import { QuizProvider } from "@/components/quiz/QuizContext";
import QuizFlow from "@/components/quiz/QuizFlow";
import FridgeScanner from "@/components/scan/FridgeScanner";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, LogIn, LogOut } from "lucide-react";

type AppMode = "welcome" | "quiz" | "scan";
const MODE_KEY = "app-mode";

function loadMode(): AppMode {
  try {
    const stored = sessionStorage.getItem(MODE_KEY);
    if (stored === "quiz" || stored === "scan") return stored;
  } catch {}
  return "welcome";
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>(loadMode);
  const { t } = useI18n();
  const { user, signOut } = useAuth();

  const changeMode = (m: AppMode) => {
    if (m === "quiz") {
      sessionStorage.removeItem("quiz-state");
    }
    sessionStorage.setItem(MODE_KEY, m);
    setMode(m);
  };

  const goWelcome = () => changeMode("welcome");

  const toolbar = (
    <div className="flex items-center justify-end gap-2 px-4 pt-4 pb-2 w-full">
      <Link to="/saved">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
          <Heart className="w-4 h-4" />
          <span className="text-xs">{t("results.viewSaved")}</span>
        </Button>
      </Link>
      <div className="flex-1" />
      {user && (
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
          {user.email}
        </span>
      )}
      <LanguageSwitcher />
      <ThemeToggle />
      {user ? (
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      ) : (
        <Link to="/auth">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <LogIn className="w-5 h-5" />
          </Button>
        </Link>
      )}
    </div>
  );

  if (mode === "quiz") {
    return (
      <QuizProvider>
        <div className="min-h-screen bg-background flex flex-col">
          {toolbar}
          <header className="pt-6 pb-2 px-4 text-center">
            <button onClick={goWelcome} className="inline-block">
              <h1 className="text-xl font-display font-bold text-primary">
                {t("app.title")}
              </h1>
            </button>
          </header>
          <main className="flex-1 flex items-start justify-center pt-4 pb-8">
            <QuizFlow />
          </main>
        </div>
      </QuizProvider>
    );
  }

  if (mode === "scan") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {toolbar}
        <FridgeScanner onBack={goWelcome} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 relative overflow-hidden">
      {/* Emoji texture background */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.06] text-[2.5rem] leading-[3rem] tracking-widest overflow-hidden" aria-hidden="true">
        <div className="absolute -left-4 -top-4 -right-4 -bottom-4 flex flex-wrap gap-x-4 gap-y-2 rotate-[-8deg] scale-110">
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i}>{["🍽️", "🥘", "🍳", "🥗", "🍲", "🧀", "🥑", "🍕"][i % 8]}</span>
          ))}
        </div>
      </div>
      {toolbar}

      <div className="flex-1 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-4 leading-tight">
          {t("app.title").split(" ").slice(0, -1).join(" ")}<br />
          <span className="text-primary">{t("app.title").split(" ").slice(-1)}</span>
        </h1>
      </motion.div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => changeMode("quiz")}
          className="group bg-primary text-primary-foreground rounded-2xl px-5 py-4 flex items-center gap-4 shadow-md hover:shadow-lg text-left transition-shadow"
        >
          <span className="text-3xl">🍽️</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold leading-snug">{t("home.findCraving")}</span>
            <span className="text-xs opacity-80 font-normal leading-tight">{t("home.findCravingSubtext")}</span>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => changeMode("scan")}
          className="group bg-secondary text-secondary-foreground rounded-2xl px-5 py-4 flex items-center gap-4 shadow-md hover:shadow-lg text-left transition-shadow"
        >
          <span className="text-3xl">🥘</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold leading-snug">{t("home.scanFridge")}</span>
            <span className="text-xs opacity-80 font-normal leading-tight">{t("home.scanFridgeSubtext")}</span>
          </div>
        </motion.button>
      </div>
      </div>
    </div>
  );
};

export default Index;
