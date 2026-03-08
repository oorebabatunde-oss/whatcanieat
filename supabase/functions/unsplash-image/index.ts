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
const RATE_LIMIT = 60;
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

const FOOD_KEYWORDS = ["food", "dish", "meal", "recipe", "cuisine", "plate", "bowl", "cooking", "ingredient", "dessert", "soup", "salad", "bread", "meat", "vegetable", "fruit", "pastry", "cheese", "rice", "noodle", "pasta", "cake", "pie", "stew", "curry", "sandwich", "drink", "beverage", "cream", "sauce", "roast", "baked", "fried"];

function looksLikeFood(photo: any): boolean {
  const text = [
    photo.alt_description || "",
    photo.description || "",
    ...(photo.tags?.map((t: any) => t.title || "") || []),
  ].join(" ").toLowerCase();
  return FOOD_KEYWORDS.some((kw) => text.includes(kw));
}

async function searchUnsplash(query: string, accessKey: string) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.results || [];
  return results.find((r: any) => looksLikeFood(r)) || null;
}

async function generateFoodImage(query: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `Generate a beautiful, appetizing food photography image of "${query}". The dish should be plated nicely on a clean background, shot from a slightly elevated angle with warm, natural lighting. Make it look like a professional food magazine photo.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch {
    return null;
  }
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
    // --- Rate limiting ---
    if (isRateLimited(clientIp)) {
      console.warn(`[${requestId}] Rate limited: IP=${clientIp}`);
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // --- Optional auth (for logging, not required) ---
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

    const { query } = body;
    if (!query || typeof query !== "string" || query.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid query parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize query: strip control characters and limit to safe chars
    const sanitizedQuery = query.replace(/[^\p{L}\p{N}\s.,'-]/gu, "").trim();
    if (!sanitizedQuery) {
      return new Response(JSON.stringify({ error: "Invalid query parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] unsplash-image: userId=${userId} IP=${clientIp} query=${sanitizedQuery}`);

    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // 1. Try Unsplash first
    if (UNSPLASH_ACCESS_KEY) {
      const unsplashQueries = [
        `${sanitizedQuery} food dish`,
        `${sanitizedQuery} food`,
        sanitizedQuery,
      ];
      for (const q of unsplashQueries) {
        const photo = await searchUnsplash(q, UNSPLASH_ACCESS_KEY);
        if (photo) {
          console.log(`[${requestId}] unsplash-image: found via Unsplash`);
          return new Response(
            JSON.stringify({
              imageUrl: photo.urls?.regular || photo.urls?.small,
              alt: photo.alt_description || sanitizedQuery,
              credit: { name: photo.user?.name, link: photo.user?.links?.html, source: "Unsplash" },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2. Fallback: Wikipedia image
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sanitizedQuery)}`;
      const wikiRes = await fetch(wikiUrl, { headers: { "User-Agent": "FoodQuizApp/1.0" } });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const wikiImage = wikiData.thumbnail?.source || wikiData.originalimage?.source;
        if (wikiImage) {
          console.log(`[${requestId}] unsplash-image: found via Wikipedia`);
          return new Response(
            JSON.stringify({
              imageUrl: wikiImage,
              alt: wikiData.title || sanitizedQuery,
              credit: { name: "Wikipedia", link: wikiData.content_urls?.desktop?.page || null, source: "Wikipedia" },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch { /* skip */ }

    // 3. Fallback: AI-generated food image
    if (LOVABLE_API_KEY) {
      const aiImage = await generateFoodImage(sanitizedQuery, LOVABLE_API_KEY);
      if (aiImage) {
        console.log(`[${requestId}] unsplash-image: generated via AI`);
        return new Response(
          JSON.stringify({
            imageUrl: aiImage,
            alt: sanitizedQuery,
            credit: { name: "AI Generated", link: null, source: "AI" },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ imageUrl: null, alt: sanitizedQuery, credit: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] unsplash-image error:`, e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
