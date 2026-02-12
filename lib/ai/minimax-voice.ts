/**
 * Minimax Text-to-Speech (T2A v2) — English voices with gender + emotion support.
 *
 * Key optimisations over the previous version:
 *  - Uses the **speech-2.8-turbo** model (latest & fastest)
 *  - Hits the **low-latency US-West endpoint** (api-uw.minimax.io)
 *  - English-language voices with language_boost
 *  - Single consistent voice per gender (no jarring voice switches)
 *  - Emotion conveyed via pitch / speed modulation
 */

// Low-latency endpoint for reduced time-to-first-audio
const MINIMAX_TTS_URL = "https://api-uw.minimax.io/v1/t2a_v2";

/**
 * One warm, child-friendly English voice per gender.
 * These stay consistent across emotions so the character always "sounds like
 * themselves" — emotion is conveyed through pitch & speed instead.
 */
const VOICE_IDS = {
  male: "English_CaptivatingStoryteller",
  female: "English_PlayfulGirl",
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

/** Pitch + speed tweaks per emotion to make the voice expressive. */
const EMOTION_MODULATION: Record<EmotionalState, { speed: number; pitch: number }> = {
  neutral:    { speed: 1.0,  pitch: 0 },
  happy:      { speed: 1.1,  pitch: 2 },
  sad:        { speed: 0.9,  pitch: -2 },
  thoughtful: { speed: 0.9,  pitch: 0 },
  angry:      { speed: 1.05, pitch: -1 },
  excited:    { speed: 1.15, pitch: 3 },
  worried:    { speed: 0.95, pitch: -1 },
};

export function selectVoiceId(gender: CharacterGender): string {
  return VOICE_IDS[gender] ?? VOICE_IDS.male;
}

/**
 * Infer gender from character textual description (heuristic).
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
  emotion: EmotionalState = "neutral"
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey || apiKey === "your-minimax-api-key") {
    console.log("Minimax API not configured, skipping voice generation");
    return null;
  }

  const voiceId = selectVoiceId(gender);
  const mod = EMOTION_MODULATION[emotion] ?? EMOTION_MODULATION.neutral;

  try {
    const response = await fetch(MINIMAX_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "speech-2.8-turbo",
        text,
        stream: false,
        language_boost: "English",
        output_format: "hex",
        voice_setting: {
          voice_id: voiceId,
          speed: mod.speed,
          vol: 1.0,
          pitch: mod.pitch,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1,
        },
      }),
    });

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
