"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookCard } from "@/components/book/book-card";
import { AddBookDialog } from "@/components/book/add-book-dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { getInitials, formatDate, truncate } from "@/lib/utils";
import Link from "next/link";

interface BookWithCount {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  genre: string | null;
  _count: { characters: number };
}

interface ConversationWithDetails {
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

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<BookWithCount[]>([]);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [booksRes, convsRes] = await Promise.all([
        fetch("/api/books"),
        fetch("/api/conversations"),
      ]);
      const [booksData, convsData] = await Promise.all([
        booksRes.json(),
        convsRes.json(),
      ]);
      if (Array.isArray(booksData)) setBooks(booksData);
      if (Array.isArray(convsData)) setConversations(convsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  if (status === "loading" || !session) {
    return (
      <div className="container py-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Welcome header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="mb-10"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back,{" "}
              <span className="gradient-text">
                {session.user?.name || "Reader"}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore books and chat with your favorite characters
            </p>
          </div>
          <AddBookDialog onBookAdded={fetchData} />
        </motion.div>
      </motion.div>

      {/* Recent Conversations */}
      {conversations.length > 0 && (
        <motion.section
          initial="initial"
          animate="animate"
          variants={stagger}
          className="mb-12"
          id="conversations"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-xl font-bold mb-4 flex items-center gap-2"
          >
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Recent Conversations
          </motion.h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {conversations.slice(0, 6).map((conv) => (
              <motion.div key={conv.id} variants={fadeInUp}>
                <Link href={`/chat/${conv.character.id}`}>
                  <GlassCard className="p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-purple-500/30">
                        <AvatarImage
                          src={conv.character.avatarUrl || undefined}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white text-sm font-serif">
                          {getInitials(conv.character.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-semibold text-sm truncate">
                          {conv.character.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          from {conv.character.book.title}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    {conv.messages[0] && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">
                        &ldquo;{truncate(conv.messages[0].content, 100)}&rdquo;
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(conv.updatedAt)}
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Books Grid */}
      <motion.section initial="initial" animate="animate" variants={stagger}>
        <motion.h2
          variants={fadeInUp}
          className="text-xl font-bold mb-4 flex items-center gap-2"
        >
          <BookOpen className="h-5 w-5 text-purple-400" />
          Your Books
        </motion.h2>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <GlassCard className="p-12 text-center" hover={false}>
              <BookOpen className="h-16 w-16 text-purple-400/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Add your first book to start chatting with characters
              </p>
              <AddBookDialog onBookAdded={fetchData} />
            </GlassCard>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <motion.div key={book.id} variants={fadeInUp}>
                <BookCard
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  genre={book.genre}
                  characterCount={book._count.characters}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
