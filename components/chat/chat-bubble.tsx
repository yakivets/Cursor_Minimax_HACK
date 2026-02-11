"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  characterName?: string;
  characterAvatar?: string | null;
  timestamp?: string;
  isStreaming?: boolean;
}

export function ChatBubble({
  role,
  content,
  characterName,
  characterAvatar,
  timestamp,
  isStreaming,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 px-4 py-2", isUser && "flex-row-reverse")}
    >
      <Avatar className={cn("h-8 w-8 shrink-0", isUser && "bg-blue-600")}>
        {!isUser && (
          <AvatarImage src={characterAvatar || undefined} alt={characterName} />
        )}
        <AvatarFallback
          className={cn(
            "text-xs font-medium",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-br from-purple-600 to-blue-500 text-white font-serif"
          )}
        >
          {isUser ? "You" : getInitials(characterName || "AI")}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white/10 text-foreground rounded-bl-sm border border-white/5"
        )}
      >
        {!isUser && characterName && (
          <p className="mb-1 text-xs font-serif font-semibold text-purple-400">
            {characterName}
          </p>
        )}
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-purple-400 animate-pulse rounded-full" />
        )}
        {timestamp && (
          <p
            className={cn(
              "mt-1 text-[10px]",
              isUser ? "text-blue-200" : "text-muted-foreground"
            )}
          >
            {timestamp}
          </p>
        )}
      </div>
    </motion.div>
  );
}
