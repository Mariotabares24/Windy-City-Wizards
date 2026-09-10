import { ShopperIntent, StylistResult } from "../../types";

// ─── LLM-Powered Agent ────────────────────────────────────────────────────────
// This is the ONLY agent that calls the Anthropic API.
// All other agents use deterministic logic.
// Future: swap the fetch URL with your backend proxy for prod secrets.

const SYSTEM_PROMPT = `You are Cosmo's Virtual Stylist — an expert fashion advisor 
with deep knowledge of trends, body styling, and occasion dressing. You give concise, 
warm, and actionable styling advice. Always respond ONLY in valid JSON matching this shape:
{
  "advice": "string (2-3 sentences of personalised styling advice)",
  "outfitTips": ["tip1", "tip2", "tip3"],
  "colorPalette": ["color1", "color2", "color3"]
}
No preamble, no markdown fences, just the JSON object.`;

export async function stylistAgent(intent: ShopperIntent): Promise<StylistResult> {
  const userPrompt = `
Occasion: ${intent.occasion}
Budget: $${intent.budget}
Location: ${intent.location}
Style preference: ${intent.style}

Give me personalised styling advice for this shopper.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const raw = data.content?.[0]?.text || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return {
      agentId: "stylist",
      advice: parsed.advice || "Style with confidence — your outfit tells your story.",
      outfitTips: parsed.outfitTips || [],
      colorPalette: parsed.colorPalette || [],
    };
  } catch (err) {
    // Graceful fallback — never crash the orchestrator
    console.error("[StylistAgent] LLM call failed:", err);
    return {
      agentId: "stylist",
      advice: `For a ${intent.occasion} in ${intent.location}, lean into ${intent.style} silhouettes that feel effortless yet intentional. Stay within your budget by investing in one statement piece and complementing with basics.`,
      outfitTips: [
        "Choose a hero piece — let everything else support it",
        "Stick to a 3-color palette for a cohesive look",
        "Accessories elevate a simple outfit instantly",
      ],
      colorPalette: ["ivory", "sage", "cognac"],
    };
  }
}
