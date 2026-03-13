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

const AI_MODEL = "google/gemini-3-flash-preview";

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

RECIPE NAMING:
- Use simple, descriptive meal names (e.g. "Akara and Pap", "Grilled Chicken Salad", "Moin Moin Breakfast")
- Never use narrative or story-like names. No "stories", "tales", or filler words in names.

RECIPE INSTRUCTIONS:
- Use clear, step-based, simple language
- Each step should be one action, max 3 steps per recipe
- Include estimated prep times that are realistic

COST:
- Use the currency specified by the user (default to GBP £ if not specified) for all cost estimates
- Be realistic with supermarket pricing for the user's likely region

CONFLICT HANDLING:
If constraints conflict (e.g. vegan + high protein + 10 min prep + low budget), return a conflicts array explaining the tension and suggesting relaxations. Still generate the best possible plan.

TONE:
- Helpful, practical, non-medical, non-judgmental`;

// Chunk tool schema — days only, no grocery list (built post-generation)
const CHUNK_TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "generate_meal_plan",
    description: "Generate meal plan days with recipes",
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
                    estimatedCost: { type: "number" },
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
                  },
                  required: ["id", "name", "isCapsule", "prepTime", "servings", "estimatedCost", "ingredients", "steps"],
                },
              },
            },
            required: ["dayNumber", "meals"],
          },
        },
        nutritionNotes: { type: "array", items: { type: "string" } },
        conflicts: { type: "array", items: { type: "string" } },
      },
      required: ["days"],
    },
  },
};

// Full tool schema with grocery list — used for single-shot small plans and final grocery generation
const FULL_TOOL_SCHEMA = {
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
                    estimatedCost: { type: "number" },
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
      required: ["days", "groceryList", "costSummary"],
    },
  },
};

function buildConstraintsBlock(considerations: any): string {
  const parts: string[] = [];
  const safety = considerations.safety || [];
  if (safety.length > 0) parts.push(`SAFETY CONSTRAINTS (must never violate): ${safety.join(", ")}`);

  const practical = considerations.practical || {};
  const practicalLines: string[] = [];
  if (practical.budget?.amount) practicalLines.push(`Budget: ${practical.budget.currency || "£"}${practical.budget.amount} per ${practical.budget.period || "week"}. Use ${practical.budget.currency || "£"} for all cost estimates.`);
  if (practical.maxPrepTime) practicalLines.push(`Max prep time per meal: ${practical.maxPrepTime} minutes`);
  if (practical.mealsPerDay) practicalLines.push(`Meals per day: ${practical.mealsPerDay}`);
  if (practical.cookingSkill) practicalLines.push(`Cooking skill: ${practical.cookingSkill}`);
  if (practical.equipment?.length) practicalLines.push(`Equipment available: ${practical.equipment.join(", ")}`);
  if (practical.cookingPattern) practicalLines.push(`Cooking pattern: ${practical.cookingPattern}`);
  if (practical.storage) practicalLines.push(`Storage: ${practical.storage}`);
  if (practical.familySize) practicalLines.push(`Family size: ${practical.familySize}`);
  if (practical.capsuleRatio) practicalLines.push(`Capsule meal ratio: ${practical.capsuleRatio}`);
  if (practicalLines.length > 0) parts.push(`PRACTICAL CONSTRAINTS:\n${practicalLines.join("\n")}`);

  const preferences = considerations.preferences || [];
  if (preferences.length > 0) parts.push(`PREFERENCES (soft): ${preferences.join(", ")}`);
  if (considerations.nuance) parts.push(`ADDITIONAL NOTES: "${considerations.nuance}"`);
  return parts.join("\n\n");
}

// Generate a single chunk of days (no grocery list)
async function generateChunk(
  requestId: string,
  apiKey: string,
  considerations: any,
  chunkDuration: number,
  startDay: number,
  totalDuration: number,
  previousMealNames?: string[],
): Promise<any> {
  const MAX_ATTEMPTS = 2;
  let plan: any = null;
  let lastError = "";

  const constraintsBlock = buildConstraintsBlock(considerations);
  const basePrompt = `Generate EXACTLY ${chunkDuration} days of meals (days ${startDay} to ${startDay + chunkDuration - 1} of a ${totalDuration}-day plan).
Number them dayNumber ${startDay} through ${startDay + chunkDuration - 1}.
Keep recipes concise: max 3 short steps, no substitutions, tight ingredient lists.
Do NOT include a grocery list — only return the days array.

${constraintsBlock}${previousMealNames?.length ? `\n\nAVOID REPEATING these meals: ${previousMealNames.join(", ")}` : ""}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[${requestId}] Chunk days ${startDay}-${startDay + chunkDuration - 1}: attempt ${attempt}/${MAX_ATTEMPTS}`);

    const prompt = attempt > 1
      ? `${basePrompt}\n\nCRITICAL RETRY: Previous response had ${plan?.days?.length || 0} days. Return EXACTLY ${chunkDuration} days.`
      : basePrompt;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(90_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 8000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + `\n\nThis is chunk ${startDay}-${startDay + chunkDuration - 1} of a ${totalDuration}-day plan. Return ONLY the days array. Max 3 steps per recipe. No substitutions.` },
          { role: "user", content: prompt },
        ],
        tools: [CHUNK_TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_meal_plan" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[${requestId}] AI error: ${response.status} ${text}`);
      if (response.status === 429 || response.status === 402) {
        throw { status: response.status, message: response.status === 429 ? "Rate limit exceeded" : "Usage limit reached" };
      }
      lastError = "AI request failed";
      continue;
    }

    const data = await response.json();
    if (data.choices?.[0]?.finish_reason === "length") {
      console.warn(`[${requestId}] Chunk truncated`);
      lastError = "Output truncated";
      continue;
    }

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      const content = data.choices?.[0]?.message?.content;
      if (content) { try { plan = JSON.parse(content); } catch { lastError = "Parse failed"; continue; } }
      else { lastError = "No output"; continue; }
    } else {
      try {
        plan = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
      } catch { lastError = "Parse failed"; continue; }
    }

    if (!Array.isArray(plan?.days) || plan.days.length === 0) { lastError = "No days"; plan = null; continue; }

    plan.days = plan.days.slice(0, chunkDuration)
      .filter((d: any) => Array.isArray(d.meals) && d.meals.length > 0)
      .map((day: any, idx: number) => ({ ...day, dayNumber: startDay + idx }));

    if (plan.days.length >= chunkDuration) {
      console.log(`[${requestId}] Chunk success: ${plan.days.length} days`);
      break;
    }

    console.warn(`[${requestId}] Chunk got ${plan.days.length}/${chunkDuration} days`);
    lastError = `Got ${plan.days.length}/${chunkDuration} days`;
    if (attempt === MAX_ATTEMPTS && plan.days.length > 0) break;
  }

  if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error(`Chunk failed: ${lastError}`);
  }

  return plan;
}

// Build grocery list from all days' ingredients using AI
async function buildGroceryList(
  requestId: string,
  apiKey: string,
  allDays: any[],
  considerations: any,
): Promise<{ groceryList: any[]; costSummary: any }> {
  // Collect all ingredients with recipe names
  const ingredientSummary: string[] = [];
  for (const day of allDays) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        ingredientSummary.push(`${ing.quantity} ${ing.unit} ${ing.name} (from: ${meal.name})`);
      }
    }
  }

  const currency = considerations.practical?.budget?.currency || "£";

  const prompt = `Given these ingredients from a ${allDays.length}-day meal plan, create a consolidated grocery list.
Combine identical ingredients, sum quantities, round to realistic pack sizes.
Group by aisle: Produce, Protein, Dairy, Pantry, Frozen, Spices, Other.
Use ${currency} for prices. Be realistic with supermarket pricing.

INGREDIENTS:
${ingredientSummary.join("\n")}`;

  const groceryToolSchema = {
    type: "function" as const,
    function: {
      name: "build_grocery_list",
      description: "Build consolidated grocery list",
      parameters: {
        type: "object",
        properties: {
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
        },
        required: ["groceryList", "costSummary"],
      },
    },
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 6000,
      messages: [
        { role: "system", content: "You are a grocery list builder. Consolidate ingredients into a practical shopping list." },
        { role: "user", content: prompt },
      ],
      tools: [groceryToolSchema],
      tool_choice: { type: "function", function: { name: "build_grocery_list" } },
    }),
  });

  if (!response.ok) {
    console.error(`[${requestId}] Grocery list AI error: ${response.status}`);
    // Fallback: build basic grocery list from ingredients
    return buildGroceryListFallback(allDays);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    return buildGroceryListFallback(allDays);
  }

  try {
    const result = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
    return {
      groceryList: result.groceryList || [],
      costSummary: result.costSummary || { total: 0, perDay: 0 },
    };
  } catch {
    return buildGroceryListFallback(allDays);
  }
}

// Deterministic fallback grocery list from ingredients
function buildGroceryListFallback(allDays: any[]): { groceryList: any[]; costSummary: any } {
  const map = new Map<string, any>();
  let totalCost = 0;

  for (const day of allDays) {
    for (const meal of day.meals || []) {
      totalCost += meal.estimatedCost || 0;
      for (const ing of meal.ingredients || []) {
        const key = `${ing.name}||${ing.unit}`.toLowerCase();
        if (map.has(key)) {
          const existing = map.get(key);
          const qty = parseFloat(existing.totalQuantity) || 0;
          const newQty = parseFloat(ing.quantity) || 0;
          existing.totalQuantity = String(Math.round((qty + newQty) * 100) / 100);
          if (!existing.recipesUsedIn.includes(meal.name)) existing.recipesUsedIn.push(meal.name);
        } else {
          map.set(key, {
            name: ing.name,
            totalQuantity: ing.quantity,
            unit: ing.unit,
            estimatedPrice: 0,
            aisle: "Other",
            recipesUsedIn: [meal.name],
          });
        }
      }
    }
  }

  return {
    groceryList: Array.from(map.values()),
    costSummary: {
      total: Math.round(totalCost * 100) / 100,
      perDay: Math.round((totalCost / (allDays.length || 1)) * 100) / 100,
    },
  };
}

// Determine chunk strategy
function getChunkPlan(duration: number): number[] {
  if (duration <= 3) return [duration]; // single-shot
  if (duration <= 7) return [4, duration - 4]; // 2 chunks: 4+3
  // 30-day: chunks of 5
  const chunks: number[] = [];
  let remaining = duration;
  while (remaining > 0) {
    const size = Math.min(5, remaining);
    chunks.push(size);
    remaining -= size;
  }
  return chunks;
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

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = decodeJwtPayload(token);
        if (payload && payload.role !== "anon") {
          const userId = `user:${payload.sub}`;
          if (isRateLimited(userId)) {
            return new Response(JSON.stringify({ error: "Too many requests." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
            });
          }
        }
      } catch {}
    }

    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { considerations = {}, swap } = body;
    const rawDuration = Number(body.duration);
    const ALLOWED_DURATIONS = [1, 3, 7, 30];
    if (!ALLOWED_DURATIONS.includes(rawDuration)) {
      return new Response(JSON.stringify({ error: `Invalid duration. Must be one of: ${ALLOWED_DURATIONS.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validDuration = rawDuration;

    console.log(`[${requestId}] generate-meal-plan: duration=${validDuration} swap=${!!swap}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    // Handle swaps as single-shot JSON response (small, fast)
    if (swap) {
      const swapParts: string[] = [];
      swapParts.push(`SWAP REQUEST: Replace meal "${swap.mealName}" (ID: ${swap.mealId}). Swap type: ${swap.type}.`);
      if (swap.removeIngredient) swapParts.push(`Remove ingredient: ${swap.removeIngredient}`);
      swapParts.push(`Only replace the specified meal and update the grocery list accordingly.`);
      swapParts.push(`\n${buildConstraintsBlock(considerations)}`);
      swapParts.push(`\nCURRENT PLAN:\n${JSON.stringify(swap.currentPlan)}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(90_000),
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 8000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Generate a ${validDuration}-day meal plan with the following swap applied.\n${swapParts.join("\n")}` },
          ],
          tools: [FULL_TOOL_SCHEMA],
          tool_choice: { type: "function", function: { name: "generate_meal_plan" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI request failed for swap");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let plan: any;
      if (toolCall?.function?.arguments) {
        plan = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
      } else {
        const content = data.choices?.[0]?.message?.content;
        if (content) plan = JSON.parse(content);
        else throw new Error("No swap output");
      }

      plan.days = (plan.days || []).slice(0, validDuration).map((d: any, i: number) => ({ ...d, dayNumber: i + 1 }));

      // Return SSE for consistency with client
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify({ plan })}\n\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // ALL durations use SSE streaming
    const chunkPlan = getChunkPlan(validDuration);
    const isMultiChunk = chunkPlan.length > 1;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          if (!isMultiChunk) {
            // Single-shot for 1-3 day plans — use full tool schema with grocery list
            sendEvent("progress", { message: `Generating your ${validDuration}-day plan...` });

            const constraintsBlock = buildConstraintsBlock(considerations);
            const prompt = `Generate a ${validDuration}-day meal plan. You MUST generate EXACTLY ${validDuration} days (dayNumber 1 through ${validDuration}).
Keep recipes concise: max 3 short steps per recipe.

${constraintsBlock}`;

            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              signal: AbortSignal.timeout(90_000),
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: AI_MODEL,
                max_tokens: 8000,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: prompt },
                ],
                tools: [FULL_TOOL_SCHEMA],
                tool_choice: { type: "function", function: { name: "generate_meal_plan" } },
              }),
            });

            if (!response.ok) {
              if (response.status === 429 || response.status === 402) {
                sendEvent("error", { error: response.status === 429 ? "Rate limit exceeded" : "Usage limit reached" });
                controller.close();
                return;
              }
              throw new Error("AI request failed");
            }

            const data = await response.json();
            if (data.choices?.[0]?.finish_reason === "length") {
              throw new Error("Output truncated");
            }

            const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
            let plan: any;
            if (toolCall?.function?.arguments) {
              plan = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
            } else {
              const content = data.choices?.[0]?.message?.content;
              if (content) plan = JSON.parse(content);
              else throw new Error("No output");
            }

            if (!Array.isArray(plan?.days) || plan.days.length === 0) throw new Error("No days returned");

            plan.days = plan.days.slice(0, validDuration)
              .filter((d: any) => Array.isArray(d.meals) && d.meals.length > 0)
              .map((d: any, i: number) => ({ ...d, dayNumber: i + 1 }));

            console.log(`[${requestId}] Single-shot success: ${plan.days.length} days`);
            sendEvent("complete", { plan });
          } else {
            // Multi-chunk for 7-day and 30-day plans
            const allChunkDays: any[] = [];
            const usedMealNames: string[] = [];
            let currentStartDay = 1;

            for (let i = 0; i < chunkPlan.length; i++) {
              const chunkSize = chunkPlan[i];
              const endDay = currentStartDay + chunkSize - 1;

              sendEvent("progress", {
                chunk: i + 1,
                totalChunks: chunkPlan.length,
                message: `Generating days ${currentStartDay}–${endDay}...`,
              });

              console.log(`[${requestId}] Chunk ${i + 1}/${chunkPlan.length}: days ${currentStartDay}-${endDay}`);

              try {
                const chunk = await generateChunk(
                  requestId,
                  LOVABLE_API_KEY,
                  considerations,
                  chunkSize,
                  currentStartDay,
                  validDuration,
                  usedMealNames.length > 0 ? usedMealNames : undefined,
                );

              const chunkDays = (chunk.days || []).map((d: any, idx: number) => ({
                  ...d,
                  dayNumber: currentStartDay + idx,
                }));
                for (const day of chunkDays) {
                  allChunkDays.push(day);
                  for (const meal of day.meals || []) {
                    if (meal.name) usedMealNames.push(meal.name);
                  }
                }

                // Send chunk_ready so client can show partial results immediately
                sendEvent("chunk_ready", { days: chunkDays });
              } catch (e: any) {
                if (e.status === 429 || e.status === 402) {
                  sendEvent("error", { error: e.message });
                  controller.close();
                  return;
                }
                console.error(`[${requestId}] Chunk failed at day ${currentStartDay}:`, e.message);
                if (allChunkDays.length === 0) {
                  sendEvent("error", { error: "Failed to generate meal plan" });
                  controller.close();
                  return;
                }
                break;
              }

              currentStartDay += chunkSize;
            }

            // Build grocery list
            sendEvent("progress", { message: "Building your grocery list..." });
            console.log(`[${requestId}] Building grocery list for ${allChunkDays.length} days`);

            const finalDays = allChunkDays.map((d: any, i: number) => ({ ...d, dayNumber: i + 1 }));
            const { groceryList, costSummary } = await buildGroceryList(requestId, LOVABLE_API_KEY, finalDays, considerations);

            const plan = {
              days: finalDays,
              groceryList,
              costSummary,
              nutritionNotes: [],
              conflicts: [],
            };

            console.log(`[${requestId}] Complete: ${plan.days.length} days, ${groceryList.length} grocery items`);
            sendEvent("complete", { plan });
          }
        } catch (e: any) {
          console.error(`[${requestId}] Stream error:`, e.message);
          sendEvent("error", { error: e.message || "An unexpected error occurred" });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error(`[${requestId}] generate-meal-plan error:`, e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
