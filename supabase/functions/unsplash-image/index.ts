import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchUnsplash(query: string, accessKey: string) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}

async function searchWikimedia(query: string) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages) as any[]) {
      if (page.thumbnail?.source) {
        return { url: page.thumbnail.source, credit: "Wikipedia" };
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
    if (!UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY is not configured");

    // Try progressively broader Unsplash queries
    const queries = [
      `${query} food`,
      query,
      `${query.split(" ").slice(0, 2).join(" ")} dish`,
      `${query.split(" ")[0]} cuisine`,
    ];

    let photo = null;
    for (const q of queries) {
      photo = await searchUnsplash(q, UNSPLASH_ACCESS_KEY);
      if (photo) break;
    }

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

    // Fallback: search Wikipedia for an image
    const wiki = await searchWikimedia(query);
    if (wiki) {
      return new Response(
        JSON.stringify({
          imageUrl: wiki.url,
          alt: query,
          credit: { name: "Wikipedia", link: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, source: "Wikipedia" },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Last resort: generic food image from Unsplash
    const fallback = await searchUnsplash("delicious plated food", UNSPLASH_ACCESS_KEY);
    if (fallback) {
      return new Response(
        JSON.stringify({
          imageUrl: fallback.urls?.regular || fallback.urls?.small,
          alt: query,
          credit: { name: fallback.user?.name, link: fallback.user?.links?.html, source: "Unsplash" },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ imageUrl: null, alt: query, credit: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("unsplash-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
