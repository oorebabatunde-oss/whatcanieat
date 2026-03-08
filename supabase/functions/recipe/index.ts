import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dish } = await req.json();
    if (!dish) throw new Error("dish is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a cooking expert. Given a dish name, provide a clear, practical recipe.

Respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{
  "name": "Dish Name",
  "prepTime": "15 min",
  "cookTime": "30 min",
  "servings": "4",
  "ingredients": ["1 cup rice", "2 tbsp oil", ...],
  "steps": ["Step 1 description", "Step 2 description", ...],
  "tips": "Optional cooking tip"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Give me a recipe for: ${dish}` },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Failed to generate recipe");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let recipe;
    try {
      recipe = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      recipe = match ? JSON.parse(match[0]) : null;
    }

    if (!recipe) throw new Error("Failed to parse recipe");

    return new Response(JSON.stringify({ recipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recipe error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
