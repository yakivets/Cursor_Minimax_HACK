"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { CharacterCard } from "@/components/book/character-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

interface Character {
  id: string;
  name: string;
  role: string | null;
  personalityTraits: string | null;
  speakingStyle: string | null;
  background: string | null;
  avatarUrl: string | null;
}

interface BookDetail {
  id: string;
  title: string;
  author: string;
  summary: string | null;
  coverImageUrl: string | null;
  genre: string | null;
  characters: Character[];
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function BookDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      fetch(`/api/books/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setBook(data);
        })
        .catch((err) => {
          console.error(err);
          router.push("/dashboard");
        })
        .finally(() => setLoading(false));
    }
  }, [session, params.id, router]);

  if (loading || !book) {
    return (
      <div className="container py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 rounded-xl mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div initial="initial" animate="animate" variants={stagger}>
        {/* Back button */}
        <motion.div variants={fadeInUp} className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </motion.div>

        {/* Book Header */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6 md:p-8 mb-8" hover={false}>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              <div className="relative h-64 w-44 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-900/40 to-blue-900/40 mx-auto md:mx-0">
                {book.coverImageUrl ? (
                  <Image
                    src={book.coverImageUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-12 w-12 text-purple-400/50" />
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1">
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  {book.title}
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">
                  by {book.author}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  {book.genre && <Badge variant="purple">{book.genre}</Badge>}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {book.characters.length} character
                    {book.characters.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {book.summary && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {book.summary}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Characters Grid */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Characters
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {book.characters.map((character) => (
            <motion.div key={character.id} variants={fadeInUp}>
              <CharacterCard
                id={character.id}
                name={character.name}
                role={character.role}
                personalityTraits={character.personalityTraits}
                avatarUrl={character.avatarUrl}
                bookTitle={book.title}
                speakingStyle={character.speakingStyle}
              />
            </motion.div>
          ))}
        </div>

        {book.characters.length === 0 && (
          <motion.div variants={fadeInUp}>
            <GlassCard className="p-12 text-center" hover={false}>
              <Users className="h-16 w-16 text-purple-400/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No characters found</h3>
              <p className="text-muted-foreground text-sm">
                This book hasn&apos;t been analyzed for characters yet.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
