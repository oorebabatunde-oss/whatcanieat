import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchWikimedia(query: string) {
  // Try exact dish name first, then broader queries
  const queries = [query, `${query} food`, `${query} dish`];
  
  for (const q of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) continue;
      for (const page of Object.values(pages) as any[]) {
        if (page.thumbnail?.source) {
          const title = page.title || q;
          return {
            url: page.thumbnail.source,
            title,
            link: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) throw new Error("Missing query parameter");

    const wiki = await searchWikimedia(query);
    if (wiki) {
      return new Response(
        JSON.stringify({
          imageUrl: wiki.url,
          alt: query,
          credit: { name: "Wikipedia", link: wiki.link, source: "Wikipedia" },
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
