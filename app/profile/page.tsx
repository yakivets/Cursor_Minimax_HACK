"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  MessageSquare,
  Calendar,
  Mail,
  User,
  Clock,
} from "lucide-react";
import { getInitials, formatDate, truncate } from "@/lib/utils";
import Link from "next/link";

interface ConversationItem {
  id: string;
  updatedAt: string;
  character: {
    id: string;
    name: string;
    avatarUrl: string | null;
    book: { title: string };
  };
  messages: { content: string; role: string }[];
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/conversations")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setConversations(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || !session) {
    return (
      <div className="container py-10">
        <Skeleton className="h-48 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Profile Header */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-8 text-center" hover={false}>
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white text-2xl font-bold">
                {getInitials(session.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{session.user?.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 text-muted-foreground text-sm">
              <Mail className="h-3.5 w-3.5" />
              {session.user?.email}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="purple" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </GlassCard>
        </motion.div>

        <Separator className="my-8 bg-white/10" />

        {/* Conversation History */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            Conversation History
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <GlassCard className="p-8 text-center" hover={false}>
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No conversations yet. Start chatting with a character!
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.character.id}`}>
                  <GlassCard className="p-4 cursor-pointer mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-purple-500/30">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white text-sm font-serif">
                          {getInitials(conv.character.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-semibold text-sm">
                          {conv.character.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conv.character.book.title}
                        </p>
                        {conv.messages[0] && (
                          <p className="text-xs text-muted-foreground mt-1 truncate italic">
                            {truncate(conv.messages[0].content, 80)}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDate(conv.updatedAt)}
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
