import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ESTIMATED_SECONDS: Record<number, number> = {
  1: 20,
  3: 35,
  7: 55,
  30: 180,
};

type LoaderVariant = "mealplan" | "craving" | "scan";

interface PlateLoaderProps {
  message?: string;
  progressMessage?: string | null;
  duration?: number;
  onNotifyReady?: () => void;
  variant?: LoaderVariant;
}

const PlateLoader = React.forwardRef<HTMLDivElement, PlateLoaderProps>(function PlateLoader({ message, progressMessage, duration = 3, onNotifyReady, variant = "mealplan" }, ref) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    try { return localStorage.getItem("mealplan-notify") === "true"; } catch { return false; }
  });
  const [notificationSupported, setNotificationSupported] = useState(false);

  const estimated = ESTIMATED_SECONDS[duration] || 35;
  const isMealplan = variant === "mealplan";

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationSupported(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isMealplan) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isMealplan]);

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

  useEffect(() => {
    if (notifyEnabled && onNotifyReady) {
      // Parent will call browser notification on completion
    }
  }, [notifyEnabled, onNotifyReady]);

  const progressPercent = Math.min((elapsed / estimated) * 100, 95);
  const remaining = Math.max(estimated - elapsed, 0);

  const getStepLabel = () => {
    if (progressMessage) return progressMessage;
    if (variant === "craving") {
      if (elapsed < 5) return t("loading.step.craving.finding");
      return t("loading.step.craving.matching");
    }
    if (variant === "scan") {
      if (elapsed < 5) return t("loading.step.scan.analyzing");
      return t("loading.step.scan.matching");
    }
    // mealplan
    if (elapsed < estimated * 0.3) return t("loading.step.crafting");
    if (elapsed < estimated * 0.7) return t("loading.step.recipes");
    if (elapsed < estimated * 0.9) return t("loading.step.grocery");
    return t("loading.step.finalising");
  };

  return (
    <div ref={ref} className="flex flex-col items-center gap-4 py-8 px-5 w-full max-w-sm mx-auto">
      <div className="relative flex flex-col items-center" style={{ height: 120 }}>
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-4xl">🍽️</span>
      </div>
      </div>

      {message && (
        <p className="text-muted-foreground text-sm text-center">{message}</p>
      )}

      {/* Step label for non-mealplan variants */}
      {!isMealplan && (
        <p className="text-muted-foreground text-xs text-center">{getStepLabel()}</p>
      )}

      {/* Progress bar — only for mealplan */}
      {isMealplan && (
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
      )}

      {/* Duration-aware explanation — only for mealplan */}
      {isMealplan && (
        <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground text-center space-y-1 w-full">
          <p>{t("loading.estimate").replace("{time}", remaining > 60 ? `${Math.ceil(remaining / 60)} ${t("loading.minutes")}` : `${remaining} ${t("loading.seconds")}`)}</p>
          {duration >= 7 && (
            <p className="text-[11px] italic">{t("loading.chunkExplain")}</p>
          )}
        </div>
      )}

      {/* Notify button — only for mealplan */}
      {isMealplan && notificationSupported && (
        <Button
          type="button"
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
});

export default PlateLoader;

// Utility to send browser notification
export function sendCompletionNotification(t: (key: string) => string) {
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    new Notification(t("loading.notifyTitle"), {
      body: t("loading.notifyBody"),
      icon: "/favicon.png",
    });
  }
}
