import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, MapPin, ChefHat } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface SavedRec {
  id: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  image_query: string | null;
  created_at: string;
}

const GUEST_KEY = "guest_saved_recommendations";

interface Props {
  user: User | null;
  authLoading: boolean;
}

export default function SavedRecommendations({ user, authLoading }: Props) {
  const { t } = useI18n();
  const [items, setItems] = useState<SavedRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authLoading) return;
    const fetchSaved = async () => {
      if (user) {
        const { data } = await supabase
          .from("saved_recommendations")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) {
          setItems(data as SavedRec[]);
          fetchImagesForItems(data as SavedRec[]);
        }
      } else {
        const stored = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]") as SavedRec[];
        setItems(stored.reverse());
        fetchImagesForItems(stored);
      }
      setLoading(false);
    };
    fetchSaved();
  }, [user, authLoading]);

  const fetchImagesForItems = (data: SavedRec[]) => {
    data.forEach(async (item) => {
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
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await supabase.from("saved_recommendations").delete().eq("id", id);
    } else {
      const stored = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]") as SavedRec[];
      localStorage.setItem(GUEST_KEY, JSON.stringify(stored.filter((i) => i.id !== id)));
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">{t("saved.empty")}</p>
      </div>
    );
  }

  return (
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
  );
}
