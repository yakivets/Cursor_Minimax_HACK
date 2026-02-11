"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ParchmentCard,
  MagicalMicButton,
  AudioWaveform,
  OrnateButton,
  QuillLoading,
} from "@/components/ui/StoryBookUI";
import {
  createSpeechRecognition,
  AudioPlayer,
} from "@/lib/voice/speechUtils";

interface Message {
  id: string;
  content: string;
  role: string;
  emotionalState: string | null;
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  illustratedAvatar: string | null;
  voiceId: string | null;
  book: { id: string; title: string; author: string };
}

export default function SpeakPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [micError, setMicError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // Fetch character data
  const fetchCharacter = useCallback(async () => {
    try {
      const res = await fetch(`/api/characters/${params.characterId}`);
      if (res.ok) {
        const data = await res.json();
        setCharacter(data);

        // Load existing conversation
        const convRes = await fetch(
          `/api/conversations/${params.characterId}`
        );
        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData) {
            setConversationId(convData.id);
            setMessages(convData.messages || []);
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

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.destroy();
      }
    };
  }, [fetchCharacter]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize audio player
  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    return () => {
      audioPlayerRef.current?.destroy();
    };
  }, []);

  // Send a message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !character || sending) return;

    setSending(true);
    setTranscript("");

    // Add user message to UI
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      role: "user",
      emotionalState: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          conversationId,
          message: content.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        setCurrentEmotion(data.emotion || "neutral");

        // Add assistant message
        const assistantMsg: Message = {
          id: data.message.id,
          content: data.message.content,
          role: "assistant",
          emotionalState: data.emotion,
          createdAt: data.message.createdAt,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Play audio if available
        if (data.audio) {
          try {
            const audioData = Uint8Array.from(atob(data.audio), (c) =>
              c.charCodeAt(0)
            ).buffer;
            setIsPlaying(true);
            await audioPlayerRef.current?.play(audioData);
            setIsPlaying(false);
          } catch (e) {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setSending(false);
    }
  };

  // Voice input controls
  const pendingTranscriptRef = useRef("");

  const toggleListening = () => {
    setMicError(null);

    if (isListening) {
      // Stop listening — the onEnd handler will send the message
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Check browser support first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const W = window as any;
      if (!W.SpeechRecognition && !W.webkitSpeechRecognition) {
        setMicError("Your browser doesn't support voice input. Please use Chrome or Edge, or switch to text mode.");
        setInputMode("text");
        return;
      }

      setTranscript("");
      pendingTranscriptRef.current = "";

      const recognition = createSpeechRecognition({
        continuous: false,
        interimResults: true,
        onResult: (text, isFinal) => {
          setTranscript(text);
          pendingTranscriptRef.current = text;
          if (isFinal) {
            // Auto-stop and send on final result
            setIsListening(false);
            pendingTranscriptRef.current = "";
            sendMessage(text);
          }
        },
        onError: (error) => {
          console.error("Speech recognition error:", error);
          setIsListening(false);
          if (error === "not-allowed" || error === "permission-denied") {
            setMicError("Microphone access denied. Please allow microphone permission in your browser settings.");
          } else if (error === "no-speech") {
            setMicError("No speech detected. Tap the mic and speak clearly.");
          } else if (error === "network") {
            setMicError("Network error — speech recognition requires an internet connection in Chrome.");
          } else {
            setMicError(`Voice error: ${error}. Try text mode instead.`);
          }
        },
        onEnd: () => {
          setIsListening(false);
          // Send whatever we captured
          const finalText = pendingTranscriptRef.current.trim();
          if (finalText) {
            pendingTranscriptRef.current = "";
            sendMessage(finalText);
          }
        },
      });

      if (recognition) {
        recognitionRef.current = recognition;
        try {
          recognition.start();
          setIsListening(true);
        } catch (err) {
          console.error("Failed to start speech recognition:", err);
          setMicError("Could not start microphone. Make sure no other app is using it, then try again.");
        }
      } else {
        setMicError("Speech recognition unavailable. Switching to text mode.");
        setInputMode("text");
      }
    }
  };

  // Text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendMessage(textInput);
      setTextInput("");
    }
  };

  // Emotion-based background colors
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
    neutral: "😐",
    happy: "😊",
    sad: "😢",
    angry: "😠",
    thoughtful: "🤔",
    excited: "😃",
    worried: "😟",
  };

  if (loading) {
    return (
      <div className="storybook-page min-h-screen flex items-center justify-center">
        <QuillLoading text="Summoning the character..." />
      </div>
    );
  }

  if (!character) return null;

  const characterColors = [
    "from-forest-500 to-forest-700",
    "from-deep-blue-500 to-deep-blue-700",
    "from-leather-400 to-leather-600",
    "from-gold-600 to-gold-800",
  ];
  const colorIndex =
    character.name.charCodeAt(0) % characterColors.length;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${
        emotionColors[currentEmotion] || emotionColors.neutral
      } transition-colors duration-1000 flex flex-col`}
    >
      {/* Header */}
      <nav className="relative z-20 border-b border-ink-700/30 bg-ink-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/book/${character.book.id}`}
            className="flex items-center gap-2 group"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-parchment-500 group-hover:text-gold-400 transition-colors"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-crimson text-sm text-parchment-400 group-hover:text-gold-400 transition-colors">
              {character.book.title}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${characterColors[colorIndex]} flex items-center justify-center`}
            >
              <span className="font-cinzel font-bold text-xs text-parchment-100">
                {character.name[0]}
              </span>
            </div>
            <div>
              <h2 className="font-quattro font-bold text-sm text-parchment-200 leading-tight">
                {character.name}
              </h2>
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {emotionEmojis[currentEmotion] || "😐"}
                </span>
                <span className="font-crimson text-xs text-parchment-500 capitalize">
                  {currentEmotion}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${characterColors[colorIndex]} flex items-center justify-center mx-auto mb-4 shadow-xl`}
              >
                <span className="font-cinzel font-bold text-3xl text-parchment-100">
                  {character.name[0]}
                </span>
              </div>
              <h3 className="font-cinzel font-semibold text-xl text-parchment-200 mb-2">
                {character.name}
              </h3>
              <p className="font-crimson text-parchment-500 italic mb-1">
                from &ldquo;{character.book.title}&rdquo;
              </p>
              {character.description && (
                <p className="font-crimson text-sm text-parchment-600 max-w-sm mx-auto mt-3">
                  {character.description}
                </p>
              )}
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent mx-auto mt-6 mb-4" />
              <p className="font-crimson text-sm text-parchment-500">
                Speak or type to begin your conversation...
              </p>
            </motion.div>
          )}

          {/* Chat messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${characterColors[colorIndex]} flex items-center justify-center flex-shrink-0 mr-2 mt-1`}
                  >
                    <span className="font-cinzel font-bold text-xs text-parchment-100">
                      {character.name[0]}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-forest-700/80 text-parchment-100"
                      : "bg-parchment-100/90 text-ink-800"
                  }`}
                >
                  <p className="font-crimson text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.emotionalState && msg.role === "assistant" && (
                    <span className="text-xs opacity-60 mt-1 inline-block">
                      {emotionEmojis[msg.emotionalState] || ""}{" "}
                      {msg.emotionalState}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {sending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${characterColors[colorIndex]} flex items-center justify-center`}
              >
                <span className="font-cinzel font-bold text-xs text-parchment-100">
                  {character.name[0]}
                </span>
              </div>
              <ParchmentCard className="px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-ink-400 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </ParchmentCard>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Transcript display */}
      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-2"
          >
            <div className="max-w-2xl mx-auto">
              <div className="bg-ink-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-ink-700/50">
                <p className="font-crimson text-sm text-parchment-400 italic">
                  {transcript || "Listening..."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t border-ink-700/30 bg-ink-900/70 backdrop-blur-sm px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Mode toggle */}
          <div className="flex justify-center mb-3 gap-2">
            <button
              onClick={() => setInputMode("voice")}
              className={`font-cinzel text-xs px-3 py-1 rounded-full transition-all ${
                inputMode === "voice"
                  ? "bg-gold-600/20 text-gold-400 border border-gold-500/30"
                  : "text-parchment-500 hover:text-parchment-300"
              }`}
            >
              🎤 Voice
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`font-cinzel text-xs px-3 py-1 rounded-full transition-all ${
                inputMode === "text"
                  ? "bg-gold-600/20 text-gold-400 border border-gold-500/30"
                  : "text-parchment-500 hover:text-parchment-300"
              }`}
            >
              ✍️ Text
            </button>
          </div>

          {inputMode === "voice" ? (
            // Voice input
            <div className="flex flex-col items-center gap-3">
              <AudioWaveform isActive={isListening || isPlaying} />
              <MagicalMicButton
                isListening={isListening}
                onClick={toggleListening}
                disabled={sending}
              />
              <p className="font-crimson text-xs text-parchment-600">
                {isListening
                  ? "Listening... tap to send"
                  : isPlaying
                  ? `${character.name} is speaking...`
                  : "Tap to speak"}
              </p>
              {micError && (
                <p className="font-crimson text-xs text-red-400 text-center max-w-xs">
                  {micError}
                </p>
              )}
            </div>
          ) : (
            // Text input
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Say something to ${character.name}...`}
                className="flex-1 px-4 py-3 bg-ink-800/50 border border-ink-700/50 rounded-lg font-crimson text-parchment-200 placeholder:text-parchment-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20"
                disabled={sending}
              />
              <OrnateButton
                type="submit"
                variant="primary"
                size="md"
                disabled={!textInput.trim() || sending}
                loading={sending}
              >
                Send
              </OrnateButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
