import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Strict CORS ---
const ALLOWED_ORIGINS = [
  "https://whatcanieat.lovable.app",
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

// --- Rate limiter ---
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

// Decode JWT payload without verification (just to check role claim)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

const MAX_B64_CHARS = 14_000_000;

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
    // --- Rate limiting (IP) ---
    if (isRateLimited(clientIp)) {
      console.warn(`[${requestId}] Rate limited: IP=${clientIp}`);
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // --- Optional auth (not required for scanning) ---
    let userId = "anonymous";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        // Skip getClaims if this is the anon key (role === "anon")
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

    // --- Input validation ---
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64 } = body;
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_B64_CHARS) {
      return new Response(JSON.stringify({ error: "Image too large or invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!imageBase64.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeMatch = imageBase64.match(/^data:image\/(jpeg|png|gif|webp|bmp);base64,/);
    if (!mimeMatch) {
      return new Response(JSON.stringify({ error: "Unsupported image type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] scan-ingredients: userId=${userId} IP=${clientIp} size=${imageBase64.length}`);

    // --- Business logic ---
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a food ingredient identifier and recipe suggestion assistant. The user will send a photo of their fridge, pantry, or cupboard. Your job:

1. Identify all visible food ingredients in the image.
2. Based on those ingredients, suggest 3-5 realistic recipes that can be made primarily with those ingredients (minor pantry staples like salt, oil, etc. can be assumed).

The user's locale is ${locale}. Prefer recipes common in their region but include variety.

You MUST respond using the "analyze_fridge" tool.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Here's a photo of what I have. What ingredients do you see, and what can I make?" },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_fridge",
              description: "Return identified ingredients and recipe suggestions from a fridge/pantry photo.",
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
                          description: "Which identified ingredients this recipe uses",
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
        tool_choice: { type: "function", function: { name: "analyze_fridge" } },
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

    console.log(`[${requestId}] scan-ingredients: success, ${result.ingredients?.length || 0} ingredients, ${result.recipes?.length || 0} recipes`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] scan-ingredients error:`, e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
