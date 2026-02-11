const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Voice IDs mapped by gender and archetype
// These are ElevenLabs pre-made voices
export const VOICE_MAP = {
  male: {
    hero:      "pNInz6obpgDQGcFmaJgB",  // Adam — strong, clear
    wise:      "VR6AewLTigWG4xSOukaG",  // Arnold — deep, authoritative
    young:     "ErXwobaYiN019PkySvjV",  // Antoni — youthful, warm
    dark:      "onwK4e9ZLuTAKqWW03F9",  // Daniel — brooding, intense
    charming:  "ODq5zmih8GrVes37Dizd",  // Patrick — smooth, refined
    default:   "pNInz6obpgDQGcFmaJgB",  // Adam
  },
  female: {
    hero:      "21m00Tcm4TlvDq8ikWAM",  // Rachel — confident, warm
    gentle:    "EXAVITQu4vr4xnSDxMaL",  // Bella — soft, kind
    young:     "jBpfuIE2acCO8z3wKNLl",  // Gigi — bright, youthful
    wise:      "ThT5KcBeYPX3keUQqHPh",  // Dorothy — mature, thoughtful
    dark:      "oWAxZDx7w5VEj9dCyTzz",  // Grace — serious, intense
    default:   "21m00Tcm4TlvDq8ikWAM",  // Rachel
  },
} as const;

/**
 * Auto-select a voice based on character gender and archetype.
 * @param gender - "male" or "female"
 * @param archetype - optional: "hero", "wise", "young", "dark", "charming", "gentle"
 */
export function pickVoiceForCharacter(
  gender: "male" | "female",
  archetype?: string
): string {
  const genderVoices = VOICE_MAP[gender];
  if (archetype && archetype in genderVoices) {
    return genderVoices[archetype as keyof typeof genderVoices];
  }
  return genderVoices.default;
}

export async function generateSpeech(
  text: string,
  voiceId?: string,
  voiceSettings?: { stability?: number; similarityBoost?: number; style?: number }
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey === "your-elevenlabs-api-key") {
    console.log("ElevenLabs API not configured, skipping voice generation");
    return null;
  }

  const voice = voiceId || VOICE_MAP.male.default;

  try {
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voice}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: voiceSettings?.stability ?? 0.5,
            similarity_boost: voiceSettings?.similarityBoost ?? 0.75,
            style: voiceSettings?.style ?? 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs TTS error:", response.status, await response.text());
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    return null;
  }
}

export async function getAvailableVoices(): Promise<
  { voice_id: string; name: string; category: string }[]
> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your-elevenlabs-api-key") return [];

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: { "xi-api-key": apiKey },
    });

    const data = await response.json();
    return (data.voices || []).map(
      (v: { voice_id: string; name: string; category: string }) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
      })
    );
  } catch {
    return [];
  }
}
