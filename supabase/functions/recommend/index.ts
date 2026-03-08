import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Strict CORS: only allow known origins ---
const ALLOWED_ORIGINS = [
  "https://whatcanieat.lovable.app",
  "https://id-preview--505389c9-ce6f-4340-8722-492bcb6e5414.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  // Allow lovable preview origins (dynamic subdomains)
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// --- In-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

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

// --- Input validation ---
const VALID_FLAVORS = ["sweet", "salty", "sour", "bitter", "umami", "spicy", "smoky", "fresh", "rich", "tangy", "mild", "herby"];
const VALID_TEXTURES = ["crispy", "creamy", "chewy", "crunchy", "soft", "flaky", "tender", "smooth", "juicy", "light", "dense", "silky"];
const VALID_DIETARY = ["none", "vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "halal", "kosher", "nut-free", "pescatarian"];

function sanitizeString(val: unknown, maxLen: number): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim().slice(0, maxLen);
  // Strip anything that's not alphanumeric, space, or basic punctuation
  return trimmed.replace(/[^\p{L}\p{N}\s.,!?'-]/gu, "");
}

function validateArray(val: unknown, allowed: string[]): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v) => typeof v === "string" && allowed.includes(v));
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const requestId = crypto.randomUUID();

  try {
    // --- Rate limiting ---
    if (isRateLimited(clientIp)) {
      console.warn(`[${requestId}] Rate limited: IP=${clientIp}`);
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // --- Optional auth (for logging/personalization, not required) ---
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
              console.warn(`[${requestId}] Rate limited user: userId=${userId}`);
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

    const craving = sanitizeString(body.craving, 200) || "anything";
    const flavors = validateArray(body.flavors, VALID_FLAVORS);
    const textures = validateArray(body.textures, VALID_TEXTURES);
    const dietary = validateArray(body.dietary, VALID_DIETARY);
    const locale = sanitizeString(body.locale, 10) || "en-US";
    const timezone = sanitizeString(body.timezone, 50) || "UTC";
    const context = sanitizeString(body.context, 200);
    const feedback = sanitizeString(body.feedback, 500);
    const rejected = Array.isArray(body.rejected)
      ? body.rejected.filter((v: unknown) => typeof v === "string").map((v: string) => v.slice(0, 100)).slice(0, 20)
      : [];

    console.log(`[${requestId}] recommend: userId=${userId} IP=${clientIp} craving=${craving}`);

    // --- Business logic ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    const langCode = locale.split("-")[0] || "en";
    const langMap: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
      ar: "Arabic", zh: "Chinese", ja: "Japanese", ko: "Korean", hi: "Hindi",
      tr: "Turkish", it: "Italian", nl: "Dutch", ru: "Russian",
    };
    const responseLang = langMap[langCode] || "English";

    const systemPrompt = `You are a food recommendation expert. Based on the user's preferences and their region, suggest exactly 3 REAL, well-known dishes that actually exist.

CRITICAL RULES:
- Only suggest REAL dishes that exist in restaurants or cookbooks (e.g., "Pad Thai", "Fish and Chips", "Tacos al Pastor")
- Prioritize dishes popular in or near the user's region/culture
- NEVER invent fake dish names
- Each dish must be something the user could actually order or cook
- IMPORTANT: Write the "name", "description", and "cuisine" fields in ${responseLang}. Keep "imageQuery" in English for image search.

User's locale: ${locale}
User's timezone: ${timezone}

For each suggestion provide a JSON object with:
- name: The real name of the dish (in ${responseLang})
- description: 1-2 sentences about why it matches their preferences (in ${responseLang})
- cuisine: The country or region of origin (in ${responseLang})
- imageQuery: A simple search term for the dish in English (just the dish name, no extra words)

Respond ONLY with a valid JSON array, no markdown, no extra text. Example:
[{"name":"Pad Thai","description":"A satisfying stir-fried noodle dish with the perfect balance of sweet and savory.","cuisine":"Thai","imageQuery":"pad thai"}]`;

    let userPrompt = `I'm looking for: ${craving}
Flavors I want: ${flavors.length ? flavors.join(", ") : "surprise me"}
Textures I like: ${textures.length ? textures.join(", ") : "surprise me"}
Dietary restrictions: ${dietary.length && !dietary.includes("none") ? dietary.join(", ") : "none"}`;

    if (rejected.length) {
      userPrompt += `\n\nDo NOT suggest these dishes (user already rejected them): ${rejected.join(", ")}`;
    }
    if (feedback) {
      userPrompt += `\n\nAdditional feedback from user: "${feedback}"`;
    }

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error(`[${requestId}] AI gateway error: ${response.status}`);
      return new Response(JSON.stringify({ error: "Failed to get recommendations" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "[]";

    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      recommendations = match ? JSON.parse(match[0]) : [];
    }

    console.log(`[${requestId}] recommend: success, ${recommendations.length} results`);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] recommend error:`, e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
