import { prisma } from "@/lib/db";
import { generateCharacterVideo } from "@/lib/ai/minimax";

/**
 * Prompt template for generating a speaking character video via Minimax.
 */
function buildVideoPrompt(characterDescription: string): string {
  return `Create a 2D animated character: ${characterDescription}. The character stands steady, faces directly toward the camera, upper body visible from waist up. Character has mouth open as if speaking/talking. Clean background. Storybook illustration style, warm lighting.`;
}

/**
 * Generate a Minimax speaking video for a character and persist the result.
 * This is meant to be called fire-and-forget (non-blocking).
 */
export async function generateCharacterSpeakingVideo(
  characterId: string,
  characterDescription: string
): Promise<string | null> {
  try {
    // Mark as generating
    await prisma.character.update({
      where: { id: characterId },
      data: { videoStatus: "generating" },
    });

    const prompt = buildVideoPrompt(characterDescription);
    const videoUrl = await generateCharacterVideo(prompt);

    if (videoUrl) {
      await prisma.character.update({
        where: { id: characterId },
        data: {
          speakingVideoUrl: videoUrl,
          videoStatus: "ready",
          videoGeneratedAt: new Date(),
        },
      });
      return videoUrl;
    } else {
      await prisma.character.update({
        where: { id: characterId },
        data: { videoStatus: "failed" },
      });
      return null;
    }
  } catch (error) {
    console.error(`Video generation failed for character ${characterId}:`, error);
    await prisma.character.update({
      where: { id: characterId },
      data: { videoStatus: "failed" },
    }).catch(() => {});
    return null;
  }
}
