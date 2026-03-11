import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://whatcanieat.lovable.app",
  "https://whatcanieat.food",
  "https://www.whatcanieat.food",
  "https://id-preview--505389c9-ce6f-4340-8722-492bcb6e5414.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

const MAX_INGREDIENTS = 30;
const MAX_INGREDIENT_LENGTH = 100;

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
    let userId = "anonymous";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = decodeJwtPayload(token);
        if (payload && payload.role !== "anon") {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
          );
          const { data: claimsData } = await supabase.auth.getClaims(token);
          if (claimsData?.claims?.sub) {
            userId = claimsData.claims.sub as string;
            if (isRateLimited(`user:${userId}`)) {
              return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
              });
            }
          }
        }
      } catch { /* proceed as anonymous */ }
    }

    // Input validation
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ingredients } = body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: "Missing or empty ingredients array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ingredients.length > MAX_INGREDIENTS) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_INGREDIENTS} ingredients allowed` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitized: string[] = [];
    for (const item of ingredients) {
      if (typeof item !== "string") {
        return new Response(JSON.stringify({ error: "Each ingredient must be a string" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const trimmed = item.trim();
      if (trimmed.length === 0) continue;
      if (trimmed.length > MAX_INGREDIENT_LENGTH) {
        return new Response(JSON.stringify({ error: `Each ingredient must be under ${MAX_INGREDIENT_LENGTH} characters` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sanitized.push(trimmed);
    }

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: "No valid ingredients provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] ingredients-to-recipes: userId=${userId} IP=${clientIp} count=${sanitized.length}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    const locale = req.headers.get("accept-language")?.split(",")[0] || "en-US";

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
          {
            role: "system",
            content: `You are a recipe suggestion assistant. The user will give you a list of ingredients they have at home. Your job:

1. Categorize each ingredient (produce, dairy, meat, grain, condiment, beverage, frozen, other).
2. Suggest 3-5 realistic recipes that can be made primarily with those ingredients (minor pantry staples like salt, oil, butter, common spices can be assumed available).

The user's locale is ${locale}. Prefer recipes common in their region but include variety.

You MUST respond using the "suggest_recipes" tool.`,
          },
          {
            role: "user",
            content: `Here are the ingredients I have: ${sanitized.join(", ")}. What can I make?`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_recipes",
              description: "Return categorized ingredients and recipe suggestions based on a list of ingredients.",
              parameters: {
                type: "object",
                properties: {
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Ingredient name" },
                        category: { type: "string", enum: ["produce", "dairy", "meat", "grain", "condiment", "beverage", "frozen", "other"] },
                      },
                      required: ["name", "category"],
                      additionalProperties: false,
                    },
                  },
                  recipes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Recipe name" },
                        description: { type: "string", description: "Brief 1-sentence description" },
                        usesIngredients: {
                          type: "array",
                          items: { type: "string" },
                          description: "Which ingredients this recipe uses",
                        },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                        timeMinutes: { type: "number", description: "Approximate cooking time in minutes" },
                      },
                      required: ["name", "description", "usesIngredients", "difficulty", "timeMinutes"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["ingredients", "recipes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_recipes" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error(`[${requestId}] AI gateway error: ${response.status}`);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    console.log(`[${requestId}] ingredients-to-recipes: success, ${result.ingredients?.length || 0} ingredients, ${result.recipes?.length || 0} recipes`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] ingredients-to-recipes error:`, e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
