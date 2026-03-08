import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CravingType = "snack" | "meal" | "unknown";
export type FlavorProfile = "salty" | "sweet" | "savoury" | "spicy" | "sour" | "umami" | "bitter" | "unknown";
export type TextureProfile = "crunchy" | "chewy" | "mushy" | "gooey" | "crispy" | "creamy" | "smooth" | "soupy" | "unknown";
export type DietaryConstraint = "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free" | "halal" | "kosher" | "none";

interface QuizState {
  step: number;
  craving: CravingType | null;
  flavors: FlavorProfile[];
  textures: TextureProfile[];
  dietary: DietaryConstraint[];
  context: string;
}

interface QuizContextType {
  state: QuizState;
  setCraving: (c: CravingType) => void;
  toggleFlavor: (f: FlavorProfile) => void;
  toggleTexture: (t: TextureProfile) => void;
  toggleDietary: (d: DietaryConstraint) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

const STORAGE_KEY = "quiz-state";

const initialState: QuizState = { step: 0, craving: null, flavors: [], textures: [], dietary: [] };

function loadState(): QuizState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialState;
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(loadState);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setCraving = (c: CravingType) => setState((s) => ({ ...s, craving: c }));

  const toggleFlavor = (f: FlavorProfile) =>
    setState((s) => {
      if (f === "unknown") return { ...s, flavors: ["unknown"] };
      const without = s.flavors.filter((x) => x !== "unknown");
      return {
        ...s,
        flavors: without.includes(f) ? without.filter((x) => x !== f) : [...without, f],
      };
    });

  const toggleTexture = (t: TextureProfile) =>
    setState((s) => {
      if (t === "unknown") return { ...s, textures: ["unknown"] };
      const without = s.textures.filter((x) => x !== "unknown");
      return {
        ...s,
        textures: without.includes(t) ? without.filter((x) => x !== t) : [...without, t],
      };
    });

  const toggleDietary = (d: DietaryConstraint) =>
    setState((s) => {
      if (d === "none") return { ...s, dietary: ["none"] };
      const without = s.dietary.filter((x) => x !== "none");
      return {
        ...s,
        dietary: without.includes(d) ? without.filter((x) => x !== d) : [...without, d],
      };
    });

  const nextStep = () => setState((s) => ({ ...s, step: s.step + 1 }));
  const prevStep = () => setState((s) => ({ ...s, step: Math.max(0, s.step - 1) }));
  const reset = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  return (
    <QuizContext.Provider value={{ state, setCraving, toggleFlavor, toggleTexture, toggleDietary, nextStep, prevStep, reset }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}
