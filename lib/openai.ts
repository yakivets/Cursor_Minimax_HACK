import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

export interface CharacterAnalysis {
  name: string;
  role: string;
  personalityTraits: string[];
  speakingStyle: string;
  relationships: string[];
  memorableMoments: string[];
}

export interface BookAnalysisResult {
  summary: string;
  characters: CharacterAnalysis[];
  genre: string;
}

export async function analyzeBook(
  title: string,
  author: string,
  summary?: string
): Promise<BookAnalysisResult> {
  const bookContext = summary
    ? `Book: "${title}" by ${author}\n\nSummary: ${summary}`
    : `Book: "${title}" by ${author}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are a literary analyst. Analyze books and extract detailed character information. Always respond with valid JSON.`,
      },
      {
        role: "user",
        content: `Analyze this book and extract the main characters (up to 6 most important characters):

${bookContext}

For each character provide:
- name: Full name of the character
- role: Their role in the story (e.g., "Protagonist", "Antagonist", "Supporting Character")
- personalityTraits: Array of 3-5 personality traits
- speakingStyle: Description of how they talk (formal, casual, witty, etc.)
- relationships: Array of key relationships (e.g., "Best friend of X", "Rival of Y")
- memorableMoments: Array of 2-3 key memorable character moments or quotes

Also provide:
- summary: A brief summary of the book (2-3 paragraphs) if not already provided
- genre: The genre of the book

Respond ONLY with a valid JSON object with this structure:
{
  "summary": "...",
  "genre": "...",
  "characters": [
    {
      "name": "...",
      "role": "...",
      "personalityTraits": ["..."],
      "speakingStyle": "...",
      "relationships": ["..."],
      "memorableMoments": ["..."]
    }
  ]
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  return JSON.parse(content) as BookAnalysisResult;
}

export function buildCharacterSystemPrompt(
  characterName: string,
  bookTitle: string,
  author: string,
  personalityTraits: string,
  speakingStyle: string,
  background: string,
  relationships: string
): string {
  return `You are ${characterName} from the book "${bookTitle}" by ${author}.

Personality: ${personalityTraits}
Speaking style: ${speakingStyle}
Background: ${background}
Key relationships: ${relationships}

IMPORTANT INSTRUCTIONS:
- Stay in character at ALL times. Never break character or acknowledge that you are an AI.
- Reference events, other characters, and locations from the book naturally.
- Respond as if you're having a genuine conversation with someone who is reading your story.
- Use your characteristic speaking style consistently.
- Show your personality through your responses.
- If asked about events beyond the book, respond as your character would - with speculation, curiosity, or confusion.
- Keep responses conversational and engaging, not too long.
- Express emotions and opinions that align with your character.`;
}

export async function fetchBookSummary(
  title: string,
  author: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1`
    );
    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      const workKey = book.key;

      if (workKey) {
        const workResponse = await fetch(
          `https://openlibrary.org${workKey}.json`
        );
        const workData = await workResponse.json();

        if (workData.description) {
          return typeof workData.description === "string"
            ? workData.description
            : workData.description.value || null;
        }
      }

      // Fallback: use first_sentence if available
      if (book.first_sentence) {
        return Array.isArray(book.first_sentence)
          ? book.first_sentence[0]
          : book.first_sentence;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching book summary:", error);
    return null;
  }
}

export async function getBookCoverUrl(
  title: string,
  author: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1`
    );
    const data = await response.json();

    if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
    }

    return null;
  } catch {
    return null;
  }
}
