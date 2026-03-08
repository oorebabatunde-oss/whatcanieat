import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FOOD_KEYWORDS = ["food", "dish", "meal", "recipe", "cuisine", "plate", "bowl", "cooking", "ingredient", "dessert", "soup", "salad", "bread", "meat", "vegetable", "fruit", "pastry", "cheese", "rice", "noodle", "pasta"];

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
  // Prefer a result that looks food-related
  return results.find((r: any) => looksLikeFood(r)) || null;
}

async function searchWikipediaBySearch(query: string) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const titles: string[] = searchData[1] || [];
    if (titles.length === 0) return null;

    for (const title of titles) {
      const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = imgData.query?.pages;
      if (!pages) continue;
      for (const page of Object.values(pages) as any[]) {
        if (page.thumbnail?.source) {
          return {
            url: page.thumbnail.source,
            title: page.title || title,
            link: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title || title)}`,
          };
        }
      }
    }
    return null;
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

    // 1. Try Unsplash first
    if (UNSPLASH_ACCESS_KEY) {
      const unsplashQueries = [
        `${query} food`,
        query,
        `${query.split(" ").slice(0, 2).join(" ")} dish`,
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

    // 2. Fallback to Wikipedia opensearch
    const wikiQueries = [
      query,
      query.replace(/with|and|on|in/gi, " ").trim(),
      query.split(" ").slice(0, 2).join(" "),
      query.split(" ")[0],
    ];
    for (const q of wikiQueries) {
      if (!q.trim()) continue;
      const result = await searchWikipediaBySearch(q);
      if (result) {
        return new Response(
          JSON.stringify({
            imageUrl: result.url,
            alt: query,
            credit: { name: "Wikipedia", link: result.link, source: "Wikipedia" },
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
