const MINIMAX_BASE_URL = "https://api.minimaxi.chat/v1";

interface VideoGenerationResponse {
  task_id: string;
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

interface VideoStatusResponse {
  task_id: string;
  status: string;
  file_id?: string;
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

interface VideoDownloadResponse {
  file: {
    download_url: string;
  };
}

export async function generateCharacterVideo(
  prompt: string,
  referenceImageUrl?: string
): Promise<string | null> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;

  if (!apiKey || !groupId || apiKey === "your-minimax-api-key") {
    console.log("Minimax API not configured, skipping video generation");
    return null;
  }

  try {
    const body: Record<string, unknown> = {
      model: "video-01",
      prompt: prompt,
    };

    if (referenceImageUrl) {
      body.first_frame_image = referenceImageUrl;
    }

    const response = await fetch(`${MINIMAX_BASE_URL}/video_generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data: VideoGenerationResponse = await response.json();

    if (!data.task_id) {
      console.error("Minimax video generation failed:", data);
      return null;
    }

    // Poll for completion
    const videoUrl = await pollVideoStatus(data.task_id, apiKey, groupId);
    return videoUrl;
  } catch (error) {
    console.error("Minimax video generation error:", error);
    return null;
  }
}

async function pollVideoStatus(
  taskId: string,
  apiKey: string,
  groupId: string,
  maxAttempts = 60
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const response = await fetch(
        `${MINIMAX_BASE_URL}/query/video_generation?task_id=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const data: VideoStatusResponse = await response.json();

      if (data.status === "Success" && data.file_id) {
        const downloadUrl = await getVideoDownloadUrl(data.file_id, apiKey, groupId);
        return downloadUrl;
      }

      if (data.status === "Fail") {
        console.error("Video generation failed:", data);
        return null;
      }
    } catch (error) {
      console.error("Error polling video status:", error);
    }
  }

  console.error("Video generation timed out");
  return null;
}

async function getVideoDownloadUrl(
  fileId: string,
  apiKey: string,
  groupId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${MINIMAX_BASE_URL}/files/retrieve?GroupId=${groupId}&file_id=${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data: VideoDownloadResponse = await response.json();
    return data.file?.download_url || null;
  } catch (error) {
    console.error("Error getting video download URL:", error);
    return null;
  }
}

export function getEmotionPrompt(characterName: string, emotion: string): string {
  const emotionDescriptions: Record<string, string> = {
    neutral: `${characterName} with a calm, composed expression, looking forward thoughtfully`,
    happy: `${characterName} with a warm smile, eyes bright with joy, slight head tilt`,
    sad: `${characterName} with downcast eyes, subtle melancholy expression, gentle sigh`,
    angry: `${characterName} with furrowed brows, intense gaze, jaw slightly clenched`,
    thoughtful: `${characterName} with a contemplative expression, looking slightly upward, hand near chin`,
    excited: `${characterName} with wide eyes, animated expression, leaning forward with enthusiasm`,
    worried: `${characterName} with concerned expression, brow furrowed, eyes showing uncertainty`,
  };

  return emotionDescriptions[emotion] || emotionDescriptions.neutral;
}
