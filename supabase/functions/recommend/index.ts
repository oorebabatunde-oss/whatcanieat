import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { craving, flavors, textures, dietary, locale, timezone, feedback, rejected } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Derive region context from locale and timezone
    const regionHint = locale || "en-US";
    const tzHint = timezone || "UTC";

    const systemPrompt = `You are a food recommendation expert. Based on the user's preferences and their region, suggest exactly 3 REAL, well-known dishes that actually exist.

CRITICAL RULES:
- Only suggest REAL dishes that exist in restaurants or cookbooks (e.g., "Pad Thai", "Fish and Chips", "Tacos al Pastor")
- Prioritize dishes popular in or near the user's region/culture
- NEVER invent fake dish names
- Each dish must be something the user could actually order or cook

User's locale: ${regionHint}
User's timezone: ${tzHint}

For each suggestion provide a JSON object with:
- name: The real name of the dish
- description: 1-2 sentences about why it matches their preferences
- cuisine: The country or region of origin (e.g., "Thai", "British", "Mexican")
- imageQuery: A simple search term for the dish (just the dish name, no extra words)

Respond ONLY with a valid JSON array, no markdown, no extra text. Example:
[{"name":"Pad Thai","description":"A satisfying stir-fried noodle dish with the perfect balance of sweet and savory.","cuisine":"Thai","imageQuery":"pad thai"}]`;

    const userPrompt = `I'm looking for: ${craving || "anything"}
Flavors I want: ${flavors?.length ? flavors.join(", ") : "surprise me"}
Textures I like: ${textures?.length ? textures.join(", ") : "surprise me"}
Dietary restrictions: ${dietary?.length && !dietary.includes("none") ? dietary.join(", ") : "none"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
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

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});