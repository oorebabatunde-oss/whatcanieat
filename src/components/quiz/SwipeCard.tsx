import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, ChefHat } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Recommendation {
  name: string;
  description: string;
  cuisine: string;
  imageQuery: string;
}

interface SwipeCardProps {
  rec: Recommendation;
  imageUrl?: string;
  imageLoaded: boolean;
  imageCredit?: { name: string; link: string; source?: string };
  onImageLoad: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  exitDirection?: "left" | "right";
}

export default function SwipeCard({
  rec,
  imageUrl,
  imageLoaded,
  imageCredit,
  onImageLoad,
  onSwipeLeft,
  onSwipeRight,
  isTop,
}: SwipeCardProps) {
  const { t } = useI18n();
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // Fly off to the right, then notify parent
      await controls.start({ x: 400, opacity: 0, transition: { duration: 0.2 } });
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      // Fly off to the left, then notify parent
      await controls.start({ x: -400, opacity: 0, transition: { duration: 0.2 } });
      onSwipeLeft();
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  };

  const handleWhereToBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(rec.name + " near me")}`, "_blank");
  };

  const handleHowToMake = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(rec.name + " recipe")}`, "_blank");
  };

  return (
    <motion.div
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      className="absolute w-full cursor-grab active:cursor-grabbing"
    >
      <div className="glass-card rounded-xl overflow-hidden shadow-md">
        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-4 left-4 z-20 bg-success/90 text-success-foreground px-3 py-1.5 rounded-lg font-display font-semibold text-sm rotate-[-12deg]"
            >
              ❤️ SAVE
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-4 right-4 z-20 bg-destructive/80 text-destructive-foreground px-3 py-1.5 rounded-lg font-display font-semibold text-sm rotate-[12deg]"
            >
              ✕ NOPE
            </motion.div>
          </>
        )}

        <AspectRatio ratio={4 / 3} className="bg-muted relative">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={rec.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={onImageLoad}
              draggable={false}
            />
          )}
          {imageCredit && imageLoaded && imageCredit.source !== "AI" && (
            <div className="absolute bottom-0 right-0 px-2 py-0.5 bg-foreground/40 rounded-tl text-[10px] text-background/80">
              Photo by{" "}
              <a
                href={`${imageCredit.link}${imageCredit.source === "Unsplash" ? "?utm_source=your_app&utm_medium=referral" : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {imageCredit.name}
              </a>
              {imageCredit.source === "Unsplash" && (
                <>
                  {" / "}
                  <a
                    href="https://unsplash.com/?utm_source=your_app&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Unsplash
                  </a>
                </>
              )}
            </div>
          )}
        </AspectRatio>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display font-semibold text-foreground text-lg">
              {rec.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {rec.cuisine}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-4">{rec.description}</p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 flex-1 min-h-[44px]"
              onClick={handleWhereToBuy}
            >
              <MapPin className="w-3.5 h-3.5" /> {t("results.whereToBuy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 flex-1 min-h-[44px]"
              onClick={handleHowToMake}
            >
              <ChefHat className="w-3.5 h-3.5" /> {t("results.howToMake")}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
