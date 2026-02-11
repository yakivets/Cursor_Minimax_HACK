"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LoadingDots, PageLoader } from "@/components/ui/loading";
import {
  BookOpen,
  ArrowLeft,
  Info,
  X,
  ChevronRight,
} from "lucide-react";
import { getInitials, formatTime } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

interface CharacterInfo {
  id: string;
  name: string;
  role: string | null;
  personalityTraits: string | null;
  speakingStyle: string | null;
  background: string | null;
  relationships: string | null;
  avatarUrl: string | null;
  book: {
    id: string;
    title: string;
    author: string;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  messages: Message[];
  character: CharacterInfo;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const characterId = params.characterId as string;

  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Fetch character and start/resume conversation
  useEffect(() => {
    if (!session || !characterId) return;

    const init = async () => {
      try {
        // Fetch character info
        const charRes = await fetch(`/api/characters/${characterId}`);
        const charData = await charRes.json();
        if (charData.error) throw new Error(charData.error);
        setCharacter(charData);

        // Create or get conversation
        const convRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId }),
        });
        const convData = await convRes.json();
        if (convData.error) throw new Error(convData.error);
        setConversation(convData);
        setMessages(
          convData.messages?.filter((m: any) => m.role !== "system") || []
        );
      } catch (error: any) {
        toast.error(error.message || "Failed to load conversation");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [session, characterId, router]);

  const handleSend = async (content: string) => {
    if (!conversation || sending) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          message: content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                // Finalize message
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  role: "assistant",
                  content: fullContent,
                  timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
              } else if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to get response");
      // Remove the optimistic user message if the request failed entirely
      if (!streamingContent) {
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!character) return null;

  const traits = character.personalityTraits
    ? JSON.parse(character.personalityTraits)
    : [];
  const relationships = character.relationships
    ? JSON.parse(character.relationships)
    : [];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="md:hidden">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden md:flex"
            >
              <Link href={`/book/${character.book.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Avatar className="h-10 w-10 border border-purple-500/30">
              <AvatarImage
                src={character.avatarUrl || undefined}
                alt={character.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white font-serif">
                {getInitials(character.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-serif font-bold text-sm">{character.name}</h2>
              <p className="text-xs text-muted-foreground">
                from {character.book.title}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(!showInfo)}
            className="text-muted-foreground hover:text-purple-400"
          >
            {showInfo ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-4">
            {messages.length === 0 && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center"
              >
                <Avatar className="h-20 w-20 border-2 border-purple-500/30 mb-4">
                  <AvatarImage
                    src={character.avatarUrl || undefined}
                    alt={character.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white font-serif text-2xl">
                    {getInitials(character.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-serif text-xl font-bold mb-1">
                  {character.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {character.role} in &ldquo;{character.book.title}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mt-2">
                  Start a conversation with {character.name}. They&apos;ll respond in
                  character, drawing from their personality and story.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {[
                    `Tell me about yourself, ${character.name}.`,
                    `What's your story?`,
                    `How are you feeling today?`,
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs border-purple-500/30 hover:bg-purple-500/10"
                      onClick={() => handleSend(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  characterName={
                    msg.role === "assistant" ? character.name : undefined
                  }
                  characterAvatar={
                    msg.role === "assistant" ? character.avatarUrl : undefined
                  }
                  timestamp={formatTime(msg.timestamp)}
                />
              ))}
            </AnimatePresence>

            {/* Streaming message */}
            {streamingContent && (
              <ChatBubble
                role="assistant"
                content={streamingContent}
                characterName={character.name}
                characterAvatar={character.avatarUrl}
                isStreaming={true}
              />
            )}

            {/* Loading indicator */}
            {sending && !streamingContent && (
              <div className="flex gap-3 px-4 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={character.avatarUrl || undefined}
                    alt={character.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white font-serif text-xs">
                    {getInitials(character.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl rounded-bl-sm bg-white/10 border border-white/5 px-4 py-2">
                  <p className="text-xs font-serif font-semibold text-purple-400 mb-1">
                    {character.name}
                  </p>
                  <LoadingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSend}
          disabled={sending}
          placeholder={`Message ${character.name}...`}
        />
      </div>

      {/* Character Info Panel (collapsible) */}
      <AnimatePresence>
        {showInfo && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-l border-white/10 bg-background/80 backdrop-blur-md overflow-hidden hidden md:block"
          >
            <ScrollArea className="h-full">
              <div className="p-6">
                {/* Character profile */}
                <div className="text-center mb-6">
                  <Avatar className="h-20 w-20 mx-auto border-2 border-purple-500/30 mb-3">
                    <AvatarImage
                      src={character.avatarUrl || undefined}
                      alt={character.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white font-serif text-2xl">
                      {getInitials(character.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-serif text-lg font-bold">
                    {character.name}
                  </h3>
                  {character.role && (
                    <p className="text-sm text-purple-400">{character.role}</p>
                  )}
                </div>

                <Separator className="my-4 bg-white/10" />

                {/* Book info */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Book
                  </h4>
                  <Link
                    href={`/book/${character.book.id}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-purple-400 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    {character.book.title}
                    <ChevronRight className="h-3 w-3 ml-auto" />
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                    by {character.book.author}
                  </p>
                </div>

                <Separator className="my-4 bg-white/10" />

                {/* Personality traits */}
                {traits.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Personality Traits
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {traits.map((trait: string) => (
                        <Badge key={trait} variant="purple" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speaking style */}
                {character.speakingStyle && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Speaking Style
                    </h4>
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;{character.speakingStyle}&rdquo;
                    </p>
                  </div>
                )}

                {/* Relationships */}
                {relationships.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Key Relationships
                    </h4>
                    <ul className="space-y-1">
                      {relationships.map((rel: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="text-purple-400 mt-1">•</span>
                          {rel}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Background */}
                {character.background && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Background
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {character.background}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
