const MINIMAX_BASE_URL = "https://api.minimaxi.chat/v1";

/**
 * Minimax voice IDs mapped by gender and emotion.
 * Reference: https://platform.minimaxi.com/document/T2A%20V2
 */
const MINIMAX_VOICES = {
  male: {
    neutral: "male-qn-qingse",
    happy: "male-qn-jingying",
    sad: "male-qn-badao",
    thoughtful: "male-qn-qingse",
    angry: "male-qn-badao",
    excited: "male-qn-jingying",
    worried: "male-qn-qingse",
  },
  female: {
    neutral: "female-shaonv",
    happy: "female-yujie",
    sad: "female-chengshu",
    thoughtful: "female-chengshu",
    angry: "female-yujie",
    excited: "female-yujie",
    worried: "female-chengshu",
  },
} as const;

export type CharacterGender = "male" | "female";
export type EmotionalState =
  | "neutral"
  | "happy"
  | "sad"
  | "thoughtful"
  | "angry"
  | "excited"
  | "worried";

export function selectVoiceId(
  gender: CharacterGender,
  emotion: EmotionalState
): string {
  return MINIMAX_VOICES[gender]?.[emotion] ?? MINIMAX_VOICES[gender]?.neutral ?? "male-qn-qingse";
}

/**
 * Infer gender from character textual description (same heuristic the old
 * ElevenLabs code used, extracted here so it can be reused).
 */
export function inferGender(
  name: string,
  description: string | null,
  personality: string | null
): CharacterGender {
  const text = `${name} ${description || ""} ${personality || ""}`.toLowerCase();
  const femaleSignals = [
    "she", "her ", "woman", "lady", "girl", "daughter", "mother", "wife",
    "queen", "princess", "miss", "mrs", "madam", "heroine", "female",
    "sister", "aunt", "niece",
  ];
  const maleSignals = [
    "he ", "his ", "him ", "man", "gentleman", "boy", "son", "father",
    "husband", "king", "prince", "mr.", "sir", "lord", "hero", "male",
    "brother", "uncle", "nephew",
  ];
  const femaleScore = femaleSignals.filter((s) => text.includes(s)).length;
  const maleScore = maleSignals.filter((s) => text.includes(s)).length;
  return femaleScore > maleScore ? "female" : "male";
}

/**
 * Generate speech audio using Minimax T2A v2.
 * Returns an ArrayBuffer of mp3 data, or null if the API is not configured.
 */
export async function generateMinimaxVoice(
  text: string,
  gender: CharacterGender,
  emotion: EmotionalState
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;

  if (!apiKey || apiKey === "your-minimax-api-key") {
    console.log("Minimax API not configured, skipping voice generation");
    return null;
  }

  const voiceId = selectVoiceId(gender, emotion);

  try {
    const response = await fetch(
      `${MINIMAX_BASE_URL}/t2a_v2?GroupId=${groupId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "speech-01-turbo",
          text,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Minimax TTS error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();

    // Minimax returns hex-encoded audio in data.data.audio
    const audioHex: string | undefined = data?.data?.audio;
    if (!audioHex) {
      console.error("No audio in Minimax TTS response:", JSON.stringify(data).slice(0, 300));
      return null;
    }

    // Convert hex string to ArrayBuffer
    const bytes = new Uint8Array(audioHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(audioHex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Minimax TTS error:", error);
    return null;
  }
}
