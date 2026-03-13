import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useMealPlan, Considerations } from "./MealPlanContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ShieldCheck, Wrench, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const SAFETY_OPTIONS = [
  "Nut allergy", "Egg allergy", "Shellfish allergy", "Soy allergy",
  "Gluten free", "Dairy free", "Vegan", "Vegetarian",
  "Diabetes friendly", "Pregnancy safe", "PCOS friendly",
  "Halal", "Kosher",
];

const EQUIPMENT_OPTIONS = ["Microwave", "Hob", "Oven", "Air fryer", "No cook"];

const PREFERENCE_OPTIONS = [
  "High protein", "Low carb", "High fibre", "Cheap ingredients",
  "Simple meals", "Familiar foods", "Variety", "Spicy",
  "Comfort food", "Quick snacks",
];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 min-h-[44px] rounded-full text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
          : "bg-card text-foreground border-border shadow-sm hover:shadow-md"
      )}
    >
      {label}
    </button>
  );
}

function Section({
  icon,
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="w-full flex items-center gap-2.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
          {icon}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-body-xs text-muted-foreground">{subtitle}</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-4 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ConsiderationsScreen() {
  const { t } = useI18n();
  const { state, setConsiderations, setDuration, generatePlan, goBackToResults } = useMealPlan();
  const hasPlan = !!state.planData;
  const [local, setLocal] = useState<Considerations>(state.considerations);
  const [dur, setDur] = useState<1 | 3 | 7 | 30>(state.duration);

  const toggleSafety = (item: string) => {
    setLocal((c) => ({
      ...c,
      safety: c.safety.includes(item) ? c.safety.filter((x) => x !== item) : [...c.safety, item],
    }));
  };

  const togglePreference = (item: string) => {
    setLocal((c) => ({
      ...c,
      preferences: c.preferences.includes(item) ? c.preferences.filter((x) => x !== item) : [...c.preferences, item],
    }));
  };

  const toggleEquipment = (item: string) => {
    setLocal((c) => ({
      ...c,
      practical: {
        ...c.practical,
        equipment: (c.practical.equipment || []).includes(item)
          ? (c.practical.equipment || []).filter((x) => x !== item)
          : [...(c.practical.equipment || []), item],
      },
    }));
  };

  const setPractical = <K extends keyof Considerations["practical"]>(key: K, val: Considerations["practical"][K]) => {
    setLocal((c) => ({ ...c, practical: { ...c.practical, [key]: val } }));
  };

  const handleGenerate = () => {
    setConsiderations(local);
    setDuration(dur);
    generatePlan();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto flex flex-col gap-4 px-5"
    >
      {hasPlan && (
        <Button variant="ghost" size="sm" onClick={goBackToResults} className="self-start gap-1.5 text-xs text-muted-foreground -mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> {t("mealplan.backToPlan")}
        </Button>
      )}
      <div className="text-center mb-2">
        <h2 className="text-display-2 font-display text-foreground">{t("mealplan.title")}</h2>
        <p className="text-body-xs text-muted-foreground mt-1">{t("mealplan.subtitle")}</p>
      </div>

      {/* Safety */}
      <Section
        icon={<ShieldCheck className="w-4 h-4 text-destructive shrink-0" />}
        title={t("mealplan.safety")}
        subtitle={t("mealplan.safetySubtitle")}
        defaultOpen
      >
        <div className="flex flex-wrap gap-2">
          {SAFETY_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={local.safety.includes(opt)} onClick={() => toggleSafety(opt)} />
          ))}
        </div>
      </Section>

      {/* Practical */}
      <Section
        icon={<Wrench className="w-4 h-4 text-primary shrink-0" />}
        title={t("mealplan.practical")}
        subtitle={t("mealplan.practicalSubtitle")}
      >
        <div className="space-y-4">
          {/* Budget */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.budget")}</p>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <div className="flex gap-1.5">
                  {["£", "$", "€"].map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={local.practical.budget?.currency === c}
                      onClick={() =>
                        setLocal((prev) => ({
                          ...prev,
                          practical: {
                            ...prev.practical,
                            budget: {
                              amount: prev.practical.budget?.amount || 0,
                              currency: prev.practical.budget?.currency === c ? "" : c,
                              period: prev.practical.budget?.period || "week",
                            },
                          },
                        }))
                      }
                    />
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={local.practical.budget?.amount || ""}
                  onChange={(e) =>
                    setLocal((prev) => ({
                      ...prev,
                      practical: {
                        ...prev.practical,
                        budget: {
                          amount: Number(e.target.value) || 0,
                          currency: prev.practical.budget?.currency || "£",
                          period: prev.practical.budget?.period || "week",
                        },
                      },
                    }))
                  }
                  className="h-10 w-28 text-base rounded-xl"
                />
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="text-body-xs text-muted-foreground">{t("mealplan.budget.per")}</span>
                {(["day", "week", "month"] as const).map((p) => (
                  <Chip
                    key={p}
                    label={t(`mealplan.budget.${p}`)}
                    selected={(local.practical.budget?.period || "week") === p}
                    onClick={() =>
                      setLocal((prev) => ({
                        ...prev,
                        practical: {
                          ...prev.practical,
                          budget: {
                            amount: prev.practical.budget?.amount || 0,
                            currency: prev.practical.budget?.currency || "£",
                            period: p,
                          },
                        },
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Max prep time */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.prepTime")}</p>
            <div className="flex gap-2">
              {[10, 20, 30, 60].map((m) => (
                <Chip key={m} label={`${m} min`} selected={local.practical.maxPrepTime === m} onClick={() => setPractical("maxPrepTime", local.practical.maxPrepTime === m ? undefined : m)} />
              ))}
            </div>
          </div>

          {/* Meals per day */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.mealsPerDay")}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip key={n} label={`${n}`} selected={local.practical.mealsPerDay === n} onClick={() => setPractical("mealsPerDay", local.practical.mealsPerDay === n ? undefined : n)} />
              ))}
            </div>
          </div>

          {/* Cooking skill */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.skill")}</p>
            <div className="flex gap-2">
              {(["beginner", "simple", "comfortable"] as const).map((s) => (
                <Chip key={s} label={t(`mealplan.skill.${s}`)} selected={local.practical.cookingSkill === s} onClick={() => setPractical("cookingSkill", local.practical.cookingSkill === s ? undefined : s)} />
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.equipment")}</p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((e) => (
                <Chip key={e} label={e} selected={(local.practical.equipment || []).includes(e)} onClick={() => toggleEquipment(e)} />
              ))}
            </div>
          </div>

          {/* Cooking pattern */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.pattern")}</p>
            <div className="flex gap-2">
              {(["daily", "batch", "no-cook-weekdays"] as const).map((p) => (
                <Chip key={p} label={t(`mealplan.pattern.${p}`)} selected={local.practical.cookingPattern === p} onClick={() => setPractical("cookingPattern", local.practical.cookingPattern === p ? undefined : p)} />
              ))}
            </div>
          </div>

          {/* Storage */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.storage")}</p>
            <div className="flex gap-2">
              {(["freezer", "fridge-only", "limited"] as const).map((s) => (
                <Chip key={s} label={t(`mealplan.storage.${s}`)} selected={local.practical.storage === s} onClick={() => setPractical("storage", local.practical.storage === s ? undefined : s)} />
              ))}
            </div>
          </div>

          {/* Family size */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.familySize")}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Chip key={n} label={`${n}`} selected={local.practical.familySize === n} onClick={() => setPractical("familySize", local.practical.familySize === n ? undefined : n)} />
              ))}
            </div>
          </div>

          {/* Capsule ratio */}
          <div>
            <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.capsule")}</p>
            <div className="flex gap-2">
              {(["none", "some", "mostly"] as const).map((r) => (
                <Chip key={r} label={t(`mealplan.capsule.${r}`)} selected={local.practical.capsuleRatio === r} onClick={() => setPractical("capsuleRatio", local.practical.capsuleRatio === r ? undefined : r)} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Preferences */}
      <Section
        icon={<Sparkles className="w-4 h-4 text-primary shrink-0" />}
        title={t("mealplan.preferences")}
        subtitle={t("mealplan.preferencesSubtitle")}
      >
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={local.preferences.includes(opt)} onClick={() => togglePreference(opt)} />
          ))}
        </div>
      </Section>

      {/* Nuance */}
      <div>
        <p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.nuance")}</p>
        <Textarea
          value={local.nuance}
          onChange={(e) => setLocal((c) => ({ ...c, nuance: e.target.value }))}
          placeholder={t("mealplan.nuancePlaceholder")}
          className="text-sm min-h-[60px] rounded-xl"
          maxLength={500}
        />
      </div>

      {/* Duration toggle */}
      <div className="flex items-center justify-center gap-2">
        {([1, 3, 7, 30] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDur(d)}
            className={cn(
              "px-4 min-h-[44px] rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              dur === d
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground shadow-sm hover:shadow-md"
            )}
          >
            {d === 30 ? "1 month" : `${d} ${d === 1 ? "day" : t("mealplan.days")}`}
          </button>
        ))}
      </div>

      {/* Generate */}
      <Button onClick={handleGenerate} className="w-full text-sm font-medium mt-1 rounded-xl">
        {t("mealplan.generate")}
      </Button>

      {state.error && (
        <p className="text-xs text-destructive text-center">{state.error}</p>
      )}
    </motion.div>
  );
}
