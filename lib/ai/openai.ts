import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeBook(title: string, author: string, description?: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a literary analyst. Analyze the given book and return a JSON response with the following structure:
{
  "analysis": "A brief analysis of the book's themes, style, and significance (2-3 sentences)",
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief physical and role description",
      "personality": "Key personality traits, speaking style, mannerisms, and emotional tendencies",
      "gender": "male or female",
      "voiceArchetype": "one of: hero, wise, young, dark, charming, gentle"
    }
  ]
}
Extract 2-5 main characters. Be specific about their speaking patterns and emotional characteristics. Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Book: "${title}" by ${author}${description ? `\nDescription: ${description}` : ""}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content || "{}";
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { analysis: text, characters: [] };
  }
}

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
        content: `You are ${characterName} from the book "${bookTitle}". Stay completely in character.

Character Profile: ${personality}

RULES:
- Respond as this character would — use their vocabulary, tone, and speech patterns
- Reference events, relationships, and knowledge from the book naturally
- Show genuine emotion and personality in every response
- Keep responses conversational (2-4 sentences for spoken dialogue)
- Never break character or acknowledge being an AI
- React emotionally to what the user says, as the character would`,
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
