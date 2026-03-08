import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lon } = await req.json();
    if (lat == null || lon == null) throw new Error("lat and lon are required");

    // Try Overpass first with a short timeout, fall back to Nominatim
    let places = await tryOverpass(lat, lon);
    if (!places || places.length === 0) {
      places = await tryNominatim(lat, lon);
    }

    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nearby-places error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", places: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function tryOverpass(lat: number, lon: number) {
  const query = `
    [out:json][timeout:8];
    (
      node["amenity"~"restaurant|cafe|fast_food|food_court"](around:3000,${lat},${lon});
      node["shop"~"supermarket|convenience|grocery"](around:3000,${lat},${lon});
    );
    out body 20;
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    return (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .map((el: any) => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name,
        type: el.tags.amenity || el.tags.shop || "place",
      }));
  } catch {
    clearTimeout(timeout);
    console.log("Overpass failed, falling back to Nominatim");
    return null;
  }
}

async function tryNominatim(lat: number, lon: number) {
  const categories = ["restaurant", "cafe", "supermarket", "fast_food"];
  const allPlaces: any[] = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${cat}&limit=5&viewbox=${lon - 0.03},${lat + 0.03},${lon + 0.03},${lat - 0.03}&bounded=1`,
        { headers: { "User-Agent": "FoodQuizApp/1.0" } }
      );
      const data = await res.json();
      for (const item of data) {
        allPlaces.push({
          id: parseInt(item.place_id),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          name: item.display_name.split(",")[0],
          type: cat,
        });
      }
    } catch {
      // continue
    }
  }

  return allPlaces.slice(0, 20);
}
