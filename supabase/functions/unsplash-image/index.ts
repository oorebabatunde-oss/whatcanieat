import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) throw new Error("Missing query parameter");

    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // 1. Try Unsplash first
    if (UNSPLASH_ACCESS_KEY) {
      const unsplashQueries = [
        `${query} food dish`,
        `${query} food`,
        query,
      ];
      for (const q of unsplashQueries) {
        const photo = await searchUnsplash(q, UNSPLASH_ACCESS_KEY);
        if (photo) {
          return new Response(
            JSON.stringify({
              imageUrl: photo.urls?.regular || photo.urls?.small,
              alt: photo.alt_description || query,
              credit: { name: photo.user?.name, link: photo.user?.links?.html, source: "Unsplash" },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2. Fallback: AI-generated food image
    if (LOVABLE_API_KEY) {
      const aiImage = await generateFoodImage(query, LOVABLE_API_KEY);
      if (aiImage) {
        return new Response(
          JSON.stringify({
            imageUrl: aiImage,
            alt: query,
            credit: { name: "AI Generated", link: null, source: "AI" },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ imageUrl: null, alt: query, credit: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("image search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
