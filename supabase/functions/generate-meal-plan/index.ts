import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type QuizAnswers = Record<string, unknown>;

const buildFallbackPlan = (profile: Record<string, unknown> | null, quizAnswers: QuizAnswers) => {
  const goals = Array.isArray(profile?.goals) ? profile.goals.join(", ") : "general wellness";
  const diet = typeof quizAnswers.diet_type === "string" ? quizAnswers.diet_type : "Balanced";
  const budget = typeof quizAnswers.budget === "string" ? quizAnswers.budget : "INR 100-200";
  const mealCount = typeof quizAnswers.meals_per_day === "string" ? quizAnswers.meals_per_day : "4 meals (with snacks)";
  const includeSnack = mealCount !== "2 meals" && mealCount !== "3 meals";

  const meals = [
    {
      type: "Breakfast",
      time: "8:00 AM",
      name: `${diet} poha with curd`,
      calories: 320,
      description: `Budget-friendly breakfast for ${goals}.`,
    },
    {
      type: "Lunch",
      time: "1:00 PM",
      name: "Roti, dal, rice and seasonal sabzi",
      calories: 520,
      description: `Built for college schedules and ${budget} planning.`,
    },
    includeSnack
      ? {
          type: "Snack",
          time: "5:00 PM",
          name: "Fruit chaat with roasted chana",
          calories: 180,
          description: "Quick hostel-friendly energy boost between classes.",
        }
      : null,
    {
      type: "Dinner",
      time: "8:30 PM",
      name: "Paneer bhurji wrap with salad",
      calories: 430,
      description: "Simple dinner that keeps protein intake practical.",
    },
  ].filter(Boolean);

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return {
    meals,
    total_calories: totalCalories,
    hydration_tip: "Carry a 1L bottle to class and refill it twice.",
    fitness_tip: "Take a brisk 20-minute walk after lunch or your evening class.",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [profileRes, quizRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user_id).maybeSingle(),
      supabase.from("quiz_responses").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const profile = profileRes.data as Record<string, unknown> | null;
    const quiz = quizRes.data;
    const quizAnswers = (quiz?.answers ?? {}) as QuizAnswers;

    const prompt = `You are a nutritionist for Indian college students. Generate a personalized daily meal plan.

User Profile:
- Name: ${profile?.name}, Age: ${profile?.age}, Weight: ${profile?.weight}kg, Height: ${profile?.height}cm
- City: ${profile?.city}
- Allergies: ${(Array.isArray(profile?.allergies) ? profile.allergies : []).join(", ") || "None"}
- Goals: ${(Array.isArray(profile?.goals) ? profile.goals : []).join(", ") || "General health"}
- Preferences: ${(Array.isArray(profile?.preferences) ? profile.preferences : []).join(", ") || "None specified"}

Quiz Answers: ${JSON.stringify(quizAnswers)}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "meals": [
    {"type": "Breakfast", "time": "8:00 AM", "name": "...", "calories": 350, "description": "..."},
    {"type": "Lunch", "time": "1:00 PM", "name": "...", "calories": 500, "description": "..."},
    {"type": "Snack", "time": "4:30 PM", "name": "...", "calories": 200, "description": "..."},
    {"type": "Dinner", "time": "8:00 PM", "name": "...", "calories": 450, "description": "..."}
  ],
  "total_calories": 1500,
  "hydration_tip": "...",
  "fitness_tip": "..."
}

Use Indian foods appropriate for college students. Keep it budget-friendly and practical.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let mealPlan = buildFallbackPlan(profile, quizAnswers);

    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a nutrition expert. Return only valid JSON." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          let content = aiData.choices?.[0]?.message?.content || "";
          content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          mealPlan = JSON.parse(content);
        }
      } catch (_error) {
        // Keep the deterministic fallback plan if the external AI dependency fails.
      }
    }

    const today = new Date().toISOString().split("T")[0];

    await supabase.from("meal_plans").upsert(
      {
        user_id,
        plan_date: today,
        meals: mealPlan.meals,
        total_calories: mealPlan.total_calories,
        nutrition_data: {
          hydration_tip: mealPlan.hydration_tip,
          fitness_tip: mealPlan.fitness_tip,
        },
      },
      { onConflict: "user_id,plan_date" },
    );

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-meal-plan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
