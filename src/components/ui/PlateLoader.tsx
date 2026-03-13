import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const FOODS = ["🥗", "🍕", "🍜", "🧁", "🥑", "🍔", "🌮", "🥘", "🍣", "🍝", "🥙", "🍛"];

const ESTIMATED_SECONDS: Record<number, number> = {
  1: 20,
  3: 35,
  7: 55,
  30: 180,
};

interface PlateLoaderProps {
  message?: string;
  progressMessage?: string | null;
  duration?: number;
  onNotifyReady?: () => void;
}

export default function PlateLoader({ message, progressMessage, duration = 3, onNotifyReady }: PlateLoaderProps) {
  const { t } = useI18n();
  const [foodIndex, setFoodIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    try { return localStorage.getItem("mealplan-notify") === "true"; } catch { return false; }
  });

  const estimated = ESTIMATED_SECONDS[duration] || 35;

  useEffect(() => {
    const interval = setInterval(() => {
      setFoodIndex((prev) => (prev + 1) % FOODS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNotifyToggle = useCallback(async () => {
    if (notifyEnabled) {
      setNotifyEnabled(false);
      localStorage.removeItem("mealplan-notify");
      return;
    }
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifyEnabled(true);
        localStorage.setItem("mealplan-notify", "true");
      }
    }
  }, [notifyEnabled]);

  // Expose notify preference for parent
  useEffect(() => {
    if (notifyEnabled && onNotifyReady) {
      // Parent will call browser notification on completion
    }
  }, [notifyEnabled, onNotifyReady]);

  const progressPercent = Math.min((elapsed / estimated) * 100, 95);
  const remaining = Math.max(estimated - elapsed, 0);

  const getStepLabel = () => {
    if (progressMessage) return progressMessage;
    if (elapsed < estimated * 0.3) return t("loading.step.crafting");
    if (elapsed < estimated * 0.7) return t("loading.step.recipes");
    if (elapsed < estimated * 0.9) return t("loading.step.grocery");
    return t("loading.step.finalising");
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8 px-5 w-full max-w-sm mx-auto">
      <div className="relative flex flex-col items-center" style={{ height: 120 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={foodIndex}
            initial={{ opacity: 0, scale: 0.3, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-5xl absolute top-0"
          >
            {FOODS[foodIndex]}
          </motion.span>
        </AnimatePresence>
        <span className="text-6xl mt-auto">🍽️</span>
      </div>

      {message && (
        <p className="text-muted-foreground text-sm text-center">{message}</p>
      )}

      {/* Progress bar */}
      <div className="w-full space-y-1.5">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{getStepLabel()}</span>
          <span>
            {remaining > 0
              ? `~${remaining}s ${t("loading.remaining")}`
              : t("loading.almostThere")
            }
          </span>
        </div>
      </div>

      {/* Duration-aware explanation */}
      <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground text-center space-y-1 w-full">
        <p>{t("loading.estimate").replace("{time}", remaining > 60 ? `${Math.ceil(remaining / 60)} ${t("loading.minutes")}` : `${remaining} ${t("loading.seconds")}`)}</p>
        {duration >= 7 && (
          <p className="text-[11px] italic">{t("loading.chunkExplain")}</p>
        )}
      </div>

      {/* Notify button */}
      {"Notification" in (typeof window !== "undefined" ? window : {}) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNotifyToggle}
          className="gap-1.5 text-xs text-muted-foreground min-h-[44px]"
        >
          {notifyEnabled ? (
            <>
              <BellOff className="w-3.5 h-3.5" />
              {t("loading.notifyOff")}
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5" />
              {t("loading.notifyMe")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Utility to send browser notification
export function sendCompletionNotification(t: (key: string) => string) {
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    new Notification(t("loading.notifyTitle"), {
      body: t("loading.notifyBody"),
      icon: "/favicon.png",
    });
  }
}
