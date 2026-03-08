import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("Missing imageBase64 parameter");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const locale = req.headers.get("accept-language")?.split(",")[0] || "en-US";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-ingredients error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
