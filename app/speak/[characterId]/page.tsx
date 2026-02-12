"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagicalMicButton,
  AudioWaveform,
  QuillLoading,
} from "@/components/ui/StoryBookUI";
import {
  createSpeechRecognition,
  AudioPlayer,
} from "@/lib/voice/speechUtils";


interface Character {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  illustratedAvatar: string | null;
  voiceId: string | null;
  sourceTitle: string | null;
  book: { id: string; title: string; author: string } | null;
}

type ChatState = "idle" | "listening" | "sending" | "speaking";

export default function SpeakPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [transcript, setTranscript] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [micError, setMicError] = useState<string | null>(null);
  /** Whether the real-time conversation loop is active */
  const [conversationActive, setConversationActive] = useState(false);

  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const conversationActiveRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    conversationActiveRef.current = conversationActive;
  }, [conversationActive]);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // ─── Fetch character ──────────────────────────────────────────
  const fetchCharacter = useCallback(async () => {
    try {
      const res = await fetch(`/api/characters/${params.characterId}`);
      if (res.ok) {
        const data = await res.json();
        setCharacter(data);

        const convRes = await fetch(`/api/conversations/${params.characterId}`);
        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData) {
            setConversationId(convData.id);
            conversationIdRef.current = convData.id;
          }
        }
      } else {
        router.push("/library");
      }
    } catch {
      router.push("/library");
    } finally {
      setLoading(false);
    }
  }, [params.characterId, router]);

  useEffect(() => {
    fetchCharacter();
    startTimeRef.current = new Date();
    return () => {
      audioPlayerRef.current?.destroy();
      endConversation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCharacter]);

  // Poll for avatar if not yet generated
  useEffect(() => {
    if (!character || character.illustratedAvatar) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/characters/${character.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.illustratedAvatar) {
            setCharacter((prev) => prev ? { ...prev, illustratedAvatar: data.illustratedAvatar } : null);
            clearInterval(interval);
          }
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [character?.id, character?.illustratedAvatar]);

  // Initialize audio player
  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    return () => { audioPlayerRef.current?.destroy(); };
  }, []);

  // ─── End conversation tracking ────────────────────────────────
  const endConversation = async () => {
    const cid = conversationIdRef.current;
    if (!cid || !startTimeRef.current) return;
    const durationSecs = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
    try {
      await fetch("/api/conversations/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: cid, durationSecs }),
      });
    } catch { /* ignore */ }
  };

  // ─── Core: send message + play response ───────────────────────
  const sendAndPlay = useCallback(async (content: string) => {
    if (!content.trim() || !character) return;
    if (isSendingRef.current) return; // prevent duplicate sends
    isSendingRef.current = true;

    setChatState("sending");
    setTranscript("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          conversationId: conversationIdRef.current,
          message: content.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        conversationIdRef.current = data.conversationId;
        setCurrentEmotion(data.emotion || "neutral");

        if (data.audio) {
          try {
            const audioData = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0)).buffer;
            setChatState("speaking");
            await audioPlayerRef.current?.play(audioData);
          } catch (e) {
            console.error("Audio playback error:", e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      isSendingRef.current = false;
      // After character finishes, always auto-listen if conversation is still active
      if (conversationActiveRef.current) {
        startListening();
      } else {
        setChatState("idle");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  // ─── Start listening ──────────────────────────────────────────
  const startListening = useCallback(() => {
    setMicError(null);

    // Stop any existing recognition before starting a new one
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    if (!W.SpeechRecognition && !W.webkitSpeechRecognition) {
      setMicError("Your browser doesn't support voice input. Please use Chrome or Edge.");
      setConversationActive(false);
      setChatState("idle");
      return;
    }

    setTranscript("");

    const pendingText = { current: "" };

    const recognition = createSpeechRecognition({
      continuous: false,
      interimResults: true,
      onResult: (text, isFinal) => {
        pendingText.current = text;
        if (isFinal) {
          pendingText.current = ""; // clear so onEnd doesn't re-send
          setChatState("sending");
          sendAndPlay(text);
        }
      },
      onError: (error) => {
        // "aborted" and "no-speech" are expected during the real-time
        // conversation loop (e.g. recognition restarts between turns,
        // brief silence gaps, etc.) — handle them silently.
        const benign = ["no-speech", "aborted", "network"];
        if (error === "not-allowed" || error === "permission-denied") {
          setMicError("Microphone access denied. Please allow microphone permission.");
          setConversationActive(false);
          conversationActiveRef.current = false;
          setChatState("idle");
        } else if (benign.includes(error)) {
          // Silently restart if the conversation is still active
          if (conversationActiveRef.current) {
            setTimeout(() => startListening(), 200);
          } else {
            setChatState("idle");
          }
        } else {
          console.error("Speech recognition error:", error);
          if (conversationActiveRef.current) {
            setTimeout(() => startListening(), 300);
          } else {
            setChatState("idle");
          }
        }
      },
      onEnd: () => {
        const finalText = pendingText.current.trim();
        if (finalText) {
          pendingText.current = "";
          sendAndPlay(finalText);
        } else if (conversationActiveRef.current) {
          // Speech ended without result — restart quickly
          setTimeout(() => startListening(), 150);
        } else {
          setChatState("idle");
        }
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setChatState("listening");
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setMicError("Could not start microphone.");
        setChatState("idle");
      }
    } else {
      setMicError("Speech recognition unavailable in this browser.");
      setConversationActive(false);
      setChatState("idle");
    }
  }, [sendAndPlay]);

  // ─── Stop listening ───────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // ─── Toggle conversation on/off ───────────────────────────────
  const toggleConversation = useCallback(() => {
    if (conversationActive) {
      // Turn off
      setConversationActive(false);
      conversationActiveRef.current = false;
      stopListening();
      setChatState("idle");
      setTranscript("");
    } else {
      // Turn on
      setConversationActive(true);
      conversationActiveRef.current = true;
      setMicError(null);
      startListening();
    }
  }, [conversationActive, startListening, stopListening]);

  // ─── Emotion + visual config ──────────────────────────────────
  const emotionColors: Record<string, string> = {
    neutral: "from-ink-800 to-ink-900",
    happy: "from-gold-900/20 to-ink-900",
    sad: "from-deep-blue-900/30 to-ink-900",
    angry: "from-red-900/20 to-ink-900",
    thoughtful: "from-forest-900/20 to-ink-900",
    excited: "from-gold-900/30 to-ink-900",
    worried: "from-leather-900/20 to-ink-900",
  };

  const emotionEmojis: Record<string, string> = {
    neutral: "😐", happy: "😊", sad: "😢", angry: "😠",
    thoughtful: "🤔", excited: "😃", worried: "😟",
  };

  if (loading) {
    return (
      <div className="storybook-page min-h-screen flex items-center justify-center">
        <QuillLoading text="Finding your friend..." />
      </div>
    );
  }

  if (!character) return null;

  const avatarSrc = character.illustratedAvatar;
  const sourceLabel = character.book?.title || character.sourceTitle || "Unknown";
  const backHref = character.book ? `/book/${character.book.id}` : "/library";

  const isSpeaking = chatState === "speaking";
  const isListening = chatState === "listening";
  const isBusy = chatState === "sending";

  // Status label
  const statusLabel =
    isSpeaking ? `${character.name} is talking...` :
    isListening ? "Listening to you..." :
    isBusy ? `${character.name} is thinking...` :
    conversationActive ? "Starting..." :
    "Tap the mic to start talking!";

  return (
    <div className={`min-h-screen bg-gradient-to-b ${emotionColors[currentEmotion] || emotionColors.neutral} transition-colors duration-1000 flex flex-col`}>
      {/* Header */}
      <nav className="relative z-20 border-b border-ink-700/30 bg-ink-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={backHref} className="flex items-center gap-2 group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-parchment-500 group-hover:text-gold-400 transition-colors">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-crimson text-sm text-parchment-400 group-hover:text-gold-400 transition-colors">{sourceLabel}</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-ink-800 ring-1 ring-parchment-500/20 flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-quattro font-bold text-sm text-parchment-200 leading-tight">{character.name}</h2>
              <div className="flex items-center gap-1">
                <span className="text-xs">{emotionEmojis[currentEmotion] || "😐"}</span>
                <span className="font-crimson text-xs text-parchment-500 capitalize">{currentEmotion}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Character view */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 min-h-0">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <motion.div
            className="relative flex flex-col items-center"
            animate={{ scale: isSpeaking ? [1, 1.04, 1.02, 1.04, 1] : 1 }}
            transition={{ duration: isSpeaking ? 0.5 : 0.2, repeat: isSpeaking ? Infinity : 0, repeatDelay: 0.1 }}
          >
            {/* Glow */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1.1 }} exit={{ opacity: 0, scale: 1 }} className="absolute inset-0 rounded-3xl bg-gold-400/20 blur-xl pointer-events-none" />
              )}
              {isListening && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: [0.3, 0.6, 0.3] }} exit={{ opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 rounded-3xl bg-forest-400/15 blur-xl pointer-events-none" />
              )}
            </AnimatePresence>

            <div className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl ring-4 transition-colors duration-500 ${
              isSpeaking ? "ring-gold-400/60" : isListening ? "ring-forest-400/40" : currentEmotion === "happy" ? "ring-gold-400/30" : "ring-parchment-500/20"
            }`}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={character.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full bg-ink-800 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-3 border-gold-400 border-t-transparent rounded-full" />
                </div>
              )}

              {/* Speaking bars */}
              {isSpeaking && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div key={i} className="w-1 bg-parchment-200/90 rounded-full" animate={{ height: [4, 14, 8, 16, 4] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }} style={{ height: 6 }} />
                  ))}
                </div>
              )}

              {/* Listening indicator on portrait */}
              {isListening && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="px-3 py-1 bg-forest-600/80 rounded-full">
                    <span className="font-crimson text-xs text-parchment-100">🎤 Listening...</span>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Character info + status */}
          <div className="text-center">
            <h2 className="font-cinzel font-semibold text-xl text-parchment-200">{character.name}</h2>
            <p className="font-crimson text-sm text-parchment-500 italic mt-0.5">from &ldquo;{sourceLabel}&rdquo;</p>

          </div>
        </div>
      </div>

      {/* Voice control area */}
      <div className="border-t border-ink-700/30 bg-ink-900/70 backdrop-blur-sm px-4 py-5">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
          <AudioWaveform isActive={isListening || isSpeaking} />

          <MagicalMicButton
            isListening={conversationActive}
            onClick={toggleConversation}
            disabled={false}
          />

          <p className="font-crimson text-xs text-parchment-600 text-center">
            {statusLabel}
          </p>

          {/* Active conversation indicator */}
          {conversationActive && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-crimson text-xs text-gold-500/70"
            >
              Real-time chat active — tap mic to stop
            </motion.p>
          )}

          {micError && (
            <p className="font-crimson text-xs text-red-400 text-center max-w-xs">{micError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
