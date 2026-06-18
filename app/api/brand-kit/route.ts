import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { brandName, industry, keywords, vibe } = await req.json();
  if (!brandName) return NextResponse.json({ error: "brandName required" }, { status: 400 });

  const prompt = `You are a brand strategist and creative director. Generate a complete brand kit for the following brand:

Brand Name: ${brandName}
Industry: ${industry || "general"}
Keywords/Values: ${keywords || "not specified"}
Desired Vibe: ${vibe || "professional, modern"}

Return ONLY valid JSON matching this exact structure:
{
  "palettes": [
    {
      "name": "Palette name",
      "description": "One-line mood description",
      "colors": [
        {"name": "Primary", "hex": "#RRGGBB", "use": "Main brand color"},
        {"name": "Secondary", "hex": "#RRGGBB", "use": "Supporting color"},
        {"name": "Accent", "hex": "#RRGGBB", "use": "Call to action"},
        {"name": "Background", "hex": "#RRGGBB", "use": "Page background"},
        {"name": "Text", "hex": "#RRGGBB", "use": "Body text"}
      ]
    }
  ],
  "taglines": ["Tagline 1", "Tagline 2", "Tagline 3", "Tagline 4", "Tagline 5"],
  "logoConcept": "Detailed 2-3 sentence description of logo concept, symbols, and style",
  "fonts": {
    "heading": {"name": "Google Font name", "style": "why it fits"},
    "body": {"name": "Google Font name", "style": "why it fits"}
  },
  "personality": ["word1", "word2", "word3", "word4", "word5"],
  "targetAudience": "2-sentence description of the ideal customer",
  "brandVoice": "2-sentence description of tone and communication style",
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"]
}

Generate exactly 3 palettes. Make the palettes distinct from each other (e.g., one bold/dark, one light/minimal, one colorful). All hex codes must be valid 6-digit hex values. Do not include any text outside the JSON.`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const kit = JSON.parse(jsonMatch[0]);
    return NextResponse.json(kit);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
