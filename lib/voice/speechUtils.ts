export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function createSpeechRecognition(config: SpeechRecognitionConfig) {
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W = window as any;
  const SpeechRecognitionCtor = W.SpeechRecognition || W.webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    config.onError?.("Speech recognition not supported in this browser");
    return null;
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = config.language || "en-US";
  recognition.continuous = config.continuous ?? false;
  recognition.interimResults = config.interimResults ?? true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let transcript = "";
    let isFinal = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }

    config.onResult?.(transcript, isFinal);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    config.onError?.(event.error);
  };

  recognition.onend = () => {
    config.onEnd?.();
  };

  return recognition;
}

// Audio playback utility
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  getIsPlaying() {
    return this.isPlaying;
  }

  async play(audioData: ArrayBuffer): Promise<void> {
    this.stop();

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(
        audioData.slice(0)
      );
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.isPlaying = true;

      // Return a promise that resolves when the audio finishes playing
      return new Promise<void>((resolve) => {
        this.currentSource!.onended = () => {
          this.isPlaying = false;
          resolve();
        };
        this.currentSource!.start(0);
      });
    } catch (error) {
      console.error("Audio playback error:", error);
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
