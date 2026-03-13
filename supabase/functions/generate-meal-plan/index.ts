import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://whatcanieat.lovable.app",
  "https://whatcanieat.food",
  "https://www.whatcanieat.food",
  "https://id-preview--505389c9-ce6f-4340-8722-492bcb6e5414.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are a meal planning expert. Generate practical, realistic meal plans based on user considerations.

PRIORITY ORDER (never violate higher priority for lower):
1. SAFETY — Never include allergens or restricted foods. This is non-negotiable.
2. PRACTICAL FIT — Respect budget, prep time, equipment, skill level, cooking pattern, storage, family size.
3. PREFERENCES — Align with soft preferences (high protein, low carb, comfort food, etc.) but never block generation.
4. NUTRITION BASELINE — Each day must include: a protein source, a fibre source, a plant food, a fat source. Avoid all-refined-carb meals, ultra-processed-only days, repeated identical meals.
5. INGREDIENT REUSE — Prefer recipes sharing ingredients to reduce waste and grocery complexity.
6. COST EFFICIENCY — Prefer affordable, widely available ingredients. Round grocery quantities to realistic pack sizes.
7. VARIETY — No repeated identical meals across the plan.

CAPSULE MEALS:
Capsule meals are quick, portable, minimal-prep meals (yogurt bowls, wraps, smoothies, snack plates, salads). Mark them with isCapsule: true.

RECIPE INSTRUCTIONS:
- Use clear, step-based, simple language
- Avoid complex chef terminology
- Each step should be one action
- Include estimated prep times that are realistic

GROCERY LIST:
- Combine identical ingredients across recipes
- Sum quantities
- Group by aisle category: Produce, Protein, Dairy, Pantry, Frozen, Spices, Other
- Round to realistic whole items / standard pack sizes
- Show which recipes use each ingredient

COST:
- Use the currency specified by the user (default to GBP £ if not specified) for all cost estimates
- Be realistic with supermarket pricing for the user's likely region

CONFLICT HANDLING:
If constraints conflict (e.g. vegan + high protein + 10 min prep + low budget), return a conflicts array explaining the tension and suggesting relaxations. Still generate the best possible plan.

TONE:
- Helpful, practical, non-medical, non-judgmental
- Say "meals selected to support stable energy" not "restrictions applied"
- Never use diet culture language`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "generate_meal_plan",
    description: "Generate a structured meal plan with recipes and grocery list",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dayNumber: { type: "number" },
              meals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    isCapsule: { type: "boolean" },
                    prepTime: { type: "number", description: "minutes" },
                    servings: { type: "number" },
                    estimatedCost: { type: "number", description: "GBP" },
                    ingredients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "string" },
                          unit: { type: "string" },
                        },
                        required: ["name", "quantity", "unit"],
                      },
                    },
                    steps: { type: "array", items: { type: "string" } },
                    substitutions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          alternative: { type: "string" },
                        },
                        required: ["original", "alternative"],
                      },
                    },
                  },
                  required: ["id", "name", "isCapsule", "prepTime", "servings", "estimatedCost", "ingredients", "steps"],
                },
              },
            },
            required: ["dayNumber", "meals"],
          },
        },
        groceryList: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              totalQuantity: { type: "string" },
              unit: { type: "string" },
              estimatedPrice: { type: "number" },
              aisle: { type: "string", enum: ["Produce", "Protein", "Dairy", "Pantry", "Frozen", "Spices", "Other"] },
              recipesUsedIn: { type: "array", items: { type: "string" } },
            },
            required: ["name", "totalQuantity", "unit", "estimatedPrice", "aisle", "recipesUsedIn"],
          },
        },
        costSummary: {
          type: "object",
          properties: {
            total: { type: "number" },
            perDay: { type: "number" },
            perMeal: { type: "number" },
          },
          required: ["total", "perDay"],
        },
        nutritionNotes: { type: "array", items: { type: "string" } },
        conflicts: { type: "array", items: { type: "string" } },
      },
      required: ["days", "groceryList", "costSummary", "nutritionNotes", "conflicts"],
    },
  },
};

function buildUserPrompt(considerations: any, duration: number, swap?: any): string {
  const parts: string[] = [];

  parts.push(`Generate a ${duration}-day meal plan.`);

  const safety = considerations.safety || [];
  if (safety.length > 0) {
    parts.push(`\nSAFETY CONSTRAINTS (must never violate): ${safety.join(", ")}`);
  }

  const practical = considerations.practical || {};
  const practicalLines: string[] = [];
  if (practical.budget?.amount) practicalLines.push(`Budget: ${practical.budget.currency || "£"}${practical.budget.amount} per ${practical.budget.period || "week"}. Use ${practical.budget.currency || "£"} for all cost estimates. Scale costs to fit the plan duration of ${duration} day(s).`);
  if (practical.maxPrepTime) practicalLines.push(`Max prep time per meal: ${practical.maxPrepTime} minutes`);
  if (practical.mealsPerDay) practicalLines.push(`Meals per day: ${practical.mealsPerDay}`);
  if (practical.cookingSkill) practicalLines.push(`Cooking skill: ${practical.cookingSkill}`);
  if (practical.equipment?.length) practicalLines.push(`Equipment available: ${practical.equipment.join(", ")}`);
  if (practical.cookingPattern) practicalLines.push(`Cooking pattern: ${practical.cookingPattern}`);
  if (practical.storage) practicalLines.push(`Storage: ${practical.storage}`);
  if (practical.familySize) practicalLines.push(`Family size: ${practical.familySize}`);
  if (practical.capsuleRatio) practicalLines.push(`Capsule meal ratio: ${practical.capsuleRatio}`);
  if (practicalLines.length > 0) {
    parts.push(`\nPRACTICAL CONSTRAINTS:\n${practicalLines.join("\n")}`);
  }

  const preferences = considerations.preferences || [];
  if (preferences.length > 0) {
    parts.push(`\nPREFERENCES (soft, influence but don't block): ${preferences.join(", ")}`);
  }

  if (considerations.nuance) {
    parts.push(`\nADDITIONAL NOTES FROM USER: "${considerations.nuance}"`);
  }

  if (swap) {
    parts.push(`\nSWAP REQUEST: Replace meal "${swap.mealName}" (ID: ${swap.mealId}). Swap type: ${swap.type}.`);
    if (swap.removeIngredient) {
      parts.push(`Remove this ingredient: ${swap.removeIngredient}`);
    }
    parts.push(`Current plan provided as context — only replace the specified meal and update the grocery list accordingly.`);
    parts.push(`\nCURRENT PLAN:\n${JSON.stringify(swap.currentPlan)}`);
  }

  return parts.join("\n");
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const requestId = crypto.randomUUID();

  try {
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // Optional auth
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = decodeJwtPayload(token);
        if (payload && payload.role !== "anon") {
          const userId = `user:${payload.sub}`;
          if (isRateLimited(userId)) {
            return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
            });
          }
        }
      } catch {}
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { considerations = {}, duration = 3, swap } = body;
    const validDuration = [1, 3, 7, 30].includes(duration) ? duration : 3;

    console.log(`[${requestId}] generate-meal-plan: duration=${validDuration} swap=${!!swap}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    const userPrompt = buildUserPrompt(considerations, validDuration, swap);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_meal_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error(`[${requestId}] AI gateway error: ${response.status} ${text}`);
      return new Response(JSON.stringify({ error: "Failed to generate meal plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      // Fallback: try parsing content as JSON
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          console.log(`[${requestId}] generate-meal-plan: success (content fallback)`);
          return new Response(JSON.stringify({ plan: parsed }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {}
      }
      console.error(`[${requestId}] No tool call in response`);
      return new Response(JSON.stringify({ error: "Failed to generate structured plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let plan: any;
    try {
      plan = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error(`[${requestId}] Failed to parse tool call arguments`);
      return new Response(JSON.stringify({ error: "Failed to parse meal plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] generate-meal-plan: success, ${plan.days?.length || 0} days`);

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] generate-meal-plan error:`, e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
