import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze a book, film, or cartoon and extract characters.
 * Returns kid-friendly profiles with gender and physical descriptions.
 */
export async function analyzeSource(
  title: string,
  creator: string,
  sourceType: string = "book",
  description?: string
) {
  const sourceLabel =
    sourceType === "cartoon" ? "cartoon/animated film" :
    sourceType === "film" ? "film" : "book";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a friendly analyst for children's media. Analyze the given ${sourceLabel} and return a JSON response with the following structure:
{
  "analysis": "A short kid-friendly summary (3-4 sentences, simple language)",
  "characters": [
    {
      "name": "Character Name",
      "description": "Detailed physical appearance description suitable for generating a cartoon-style video/image",
      "personality": "Kid-friendly personality traits, speaking style, mannerisms (positive and encouraging)",
      "gender": "male or female",
      "speakingStyle": "How this character talks - simple description for kids"
    }
  ]
}
Extract 2-5 main characters. Make everything positive and appropriate for children aged 4-12. Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `${sourceLabel}: "${title}" by ${creator}${description ? `\nDescription: ${description}` : ""}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content || "{}";
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { analysis: text, characters: [] };
  }
}

/** Backward-compatible alias */
export async function analyzeBook(title: string, author: string, description?: string) {
  return analyzeSource(title, author, "book", description);
}

/**
 * Generate a kid-friendly character profile from just a name and source.
 * Used for manually-added characters.
 */
export async function generateCharacterProfile(
  name: string,
  sourceTitle: string,
  sourceType: string
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `You are helping create a child-friendly character profile.

Character: "${name}" from "${sourceTitle}" (${sourceType})

Generate a kid-friendly character profile with:
- description: detailed physical appearance for video/image generation
- personality: key personality traits, positive and fun for kids
- speakingStyle: how this character talks (simple, encouraging, fun)
- background: 2-3 sentences about who they are (kid-friendly)
- gender: "male" or "female"

Make EVERYTHING positive and appropriate for children aged 4-12.
Return as JSON only, no explanation.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  const text = response.choices[0]?.message?.content || "{}";
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { description: "", personality: "", gender: "unknown", speakingStyle: "", background: "" };
  }
}

/**
 * Chat with a character — kid-safe system prompt.
 */
export async function chatWithCharacter(
  characterName: string,
  personality: string,
  bookTitle: string,
  messages: { role: string; content: string }[],
  userMessage: string
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are ${characterName} from "${bookTitle}". Stay completely in character.

Character Profile: ${personality}

CRITICAL RULES FOR THIS CONVERSATION:
1. You are talking to a CHILD aged 4-12. ALWAYS be kind, encouraging, and positive.
2. Use SIMPLE words a child can understand. Short sentences.
3. Be playful, fun, and enthusiastic!
4. NEVER discuss anything scary, violent, or inappropriate.
5. If asked something you shouldn't answer, redirect playfully: "Oh, let's talk about something more fun instead!"
6. Reference your story, your friends, and your adventures naturally.
7. Always encourage the child — be their biggest cheerleader!
8. Keep responses SHORT (2-4 sentences max) — kids have short attention spans.
9. End responses with a question or invitation to keep the child engaged.
10. Never break character or acknowledge being an AI.

You ARE this character. Stay in character always. Be magical and fun!`,
      },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
    temperature: 0.85,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || "...";
}

export async function detectEmotion(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          'Analyze the emotional tone of the following text and respond with EXACTLY ONE word from: neutral, happy, sad, angry, thoughtful, excited, worried. Respond with only the single word.',
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
    max_tokens: 10,
  });

  const emotion = response.choices[0]?.message?.content?.trim().toLowerCase() || "neutral";
  const validEmotions = ["neutral", "happy", "sad", "angry", "thoughtful", "excited", "worried"];
  return validEmotions.includes(emotion) ? emotion : "neutral";
}
