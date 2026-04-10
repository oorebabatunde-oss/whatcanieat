import React from "react";
import { Home, Heart, Globe, Settings, Download, LogIn, LogOut, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n, SUPPORTED_LANGS } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showPanel, setShowPanel] = useState<"language" | "settings" | null>(null);

  const tabs = [
    { id: "home", icon: Home, label: t("nav.home"), action: () => { setShowPanel(null); sessionStorage.removeItem("app-mode"); sessionStorage.removeItem("quiz-state"); window.dispatchEvent(new Event("go-home")); navigate("/"); } },
    { id: "saved", icon: Heart, label: t("nav.saved"), action: () => { setShowPanel(null); navigate("/saved"); } },
    { id: "language", icon: Globe, label: t("nav.language"), action: () => setShowPanel(showPanel === "language" ? null : "language") },
    { id: "settings", icon: Settings, label: t("nav.settings"), action: () => setShowPanel(showPanel === "settings" ? null : "settings") },
  ];

  const isActive = (id: string) => {
    if (id === "home") return location.pathname === "/";
    if (id === "saved") return location.pathname === "/saved";
    if (id === "language") return showPanel === "language";
    if (id === "settings") return showPanel === "settings";
    return false;
  };

  return (
    <>
      {/* Overlay panels */}
      <AnimatePresence>
        {showPanel && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPanel(null)} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-md px-4 pb-2"
            >
              <div className="glass-card rounded-2xl shadow-lg border border-border p-4">
                {showPanel === "language" && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{t("nav.language")}</h3>
                    <p className="text-[11px] text-muted-foreground italic mb-2">{t("lang.generatedContentNote")}</p>
                    <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto">
                      {SUPPORTED_LANGS.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setShowPanel(null); }}
                          className={`text-xs px-2 py-2 rounded-lg transition-colors text-left truncate ${
                            lang === l.code
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showPanel === "settings" && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{t("nav.settings")}</h3>

                    {user && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}

                    <div className="flex flex-col gap-2">
                      {/* Theme toggle */}
                      <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground min-h-[44px]"
                      >
                        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {theme === "dark" ? t("settings.lightMode") : t("settings.darkMode")}
                      </button>

                      {/* Install app */}
                      <InstallButton />

                      {/* Auth */}
                      {user ? (
                        <button
                          onClick={() => { signOut(); setShowPanel(null); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground min-h-[44px]"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("settings.signOut")}
                        </button>
                      ) : (
                        <button
                          onClick={() => { navigate("/auth"); setShowPanel(null); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground min-h-[44px]"
                        >
                          <LogIn className="w-4 h-4" />
                          {t("settings.signIn")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-around max-w-md mx-auto h-14">
          {tabs.map((tab) => {
            const active = isActive(tab.id);
            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// Module-level variable to capture the install prompt even before component mounts
let _deferredPrompt: any = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredPrompt = e;
});

function InstallButton() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(_deferredPrompt);
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isInstalled] = useState(() => window.matchMedia("(display-mode: standalone)").matches);

  // Listen for install prompt (in case it fires after component mounts)
  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      _deferredPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground min-h-[44px]"
      >
        <Download className="w-4 h-4" />
        {t("settings.install")}
      </button>
    );
  }

  if (isIOS) {
    return (
      <div className="px-3 py-2.5 rounded-xl text-xs text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-4 h-4 shrink-0" />
          <span className="text-sm text-foreground">{t("settings.install")}</span>
        </div>
        <p>{t("settings.installIOS")}</p>
      </div>
    );
  }

  // Always show install option even when prompt hasn't fired
  return (
    <button
      onClick={() => {
        toast.info(t("settings.installBrowser"));
      }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground min-h-[44px]"
    >
      <Download className="w-4 h-4" />
      {t("settings.install")}
    </button>
  );
}
