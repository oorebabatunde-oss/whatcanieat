import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, MapPin, ChefHat, Loader2, LogOut } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface SavedRec {
  id: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  image_query: string | null;
  created_at: string;
}

export default function Saved() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<SavedRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const fetchSaved = async () => {
      const { data } = await supabase
        .from("saved_recommendations")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setItems(data as SavedRec[]);
        data.forEach(async (item: SavedRec) => {
          if (item.image_query) {
            try {
              const { data: imgData } = await supabase.functions.invoke("unsplash-image", {
                body: { query: item.image_query },
              });
              if (imgData?.imageUrl) {
                setImageUrls((prev) => ({ ...prev, [item.id]: imgData.imageUrl }));
              }
            } catch {}
          }
        });
      }
      setLoading(false);
    };
    fetchSaved();
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("saved_recommendations").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Auth guard: redirect to /auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-end gap-2 px-4 pt-4 pb-2 w-full">
        <div className="flex-1" />
        {user && (
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {user.email}
          </span>
        )}
        <LanguageSwitcher />
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("saved.title")}
          </h1>
        </div>

        {loading || authLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">{t("saved.empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                >
                  <AspectRatio ratio={16 / 9} className="bg-muted relative">
                    {!imageLoaded[item.id] && (
                      <Skeleton className="absolute inset-0 w-full h-full" />
                    )}
                    {imageUrls[item.id] && (
                      <img
                        src={imageUrls[item.id]}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          imageLoaded[item.id] ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImageLoaded((prev) => ({ ...prev, [item.id]: true }))}
                      />
                    )}
                  </AspectRatio>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground text-base">
                          {item.name}
                        </h3>
                        {item.cuisine && (
                          <Badge variant="secondary" className="text-xs">
                            {item.cuisine}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {item.description && (
                      <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 flex-1"
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(item.name + " near me")}`, "_blank")}
                      >
                        <MapPin className="w-3.5 h-3.5" /> {t("results.whereToBuy")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 flex-1"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.name + " recipe")}`, "_blank")}
                      >
                        <ChefHat className="w-3.5 h-3.5" /> {t("results.howToMake")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
