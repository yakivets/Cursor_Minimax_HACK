"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  OrnateButton,
  ParchmentCard,
  IllustratedHeader,
  InkDivider,
  QuillLoading,
} from "@/components/ui/StoryBookUI";

interface Character {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  illustratedAvatar: string | null;
  voiceId: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  description: string | null;
  genre: string | null;
  analysis: string | null;
  characters: Character[];
}

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBook = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
      } else {
        router.push("/library");
      }
    } catch {
      router.push("/library");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  if (loading) {
    return (
      <div className="storybook-page min-h-screen flex items-center justify-center">
        <QuillLoading text="Turning to the right page..." />
      </div>
    );
  }

  if (!book) return null;

  const characterColors = [
    "from-forest-500 to-forest-700",
    "from-deep-blue-500 to-deep-blue-700",
    "from-leather-400 to-leather-600",
    "from-gold-600 to-gold-800",
    "from-moss-500 to-moss-700",
  ];

  return (
    <div className="storybook-page min-h-screen">
      {/* Navigation */}
      <nav className="relative z-20 border-b border-ink-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/library" className="flex items-center gap-2 group">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-parchment-500 group-hover:text-gold-400 transition-colors"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-cinzel text-sm text-parchment-400 group-hover:text-gold-400 transition-colors tracking-wider">
              Back to Library
            </span>
          </Link>

          <h1 className="font-cinzel font-bold text-xl tracking-wider">
            <span className="gold-shimmer">STORY</span>
            <span className="text-parchment-400 mx-1">·</span>
            <span className="text-parchment-300">PALS</span>
          </h1>
        </div>
      </nav>

      {/* Book Header */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Ornate book display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Decorative book cover */}
          <div className="inline-block mb-6">
            <div className="relative w-48 h-64 bg-gradient-to-br from-leather-400 to-leather-700 rounded-r-md shadow-xl ornate-frame mx-auto">
              <div className="absolute inset-4 border border-gold-500/30 rounded-sm flex flex-col items-center justify-center px-3">
                <h2 className="font-cinzel font-bold text-sm text-parchment-100 text-center leading-tight">
                  {book.title}
                </h2>
                <div className="w-12 h-px bg-gold-400/40 my-2" />
                <p className="font-crimson text-xs text-parchment-300 italic">
                  {book.author}
                </p>
              </div>
              {/* Spine effect */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
            </div>
          </div>

          <IllustratedHeader
            title={book.title}
            subtitle={`by ${book.author}`}
          />

          {book.analysis && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-crimson text-parchment-400 max-w-xl mx-auto mt-4 leading-relaxed italic"
            >
              &ldquo;{book.analysis}&rdquo;
            </motion.p>
          )}
        </motion.div>

        <InkDivider />

        {/* Characters Section */}
        <div className="mt-10">
          <h2 className="font-cinzel font-bold text-2xl text-parchment-200 text-center mb-8">
            Friends in This Story
          </h2>

          {book.characters.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-crimson text-parchment-500 italic">
                No friends found in this story yet...
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {book.characters.map((character, i) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                >
                  <ParchmentCard hover className="h-full">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Character avatar */}
                        <div
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                            characterColors[i % characterColors.length]
                          } flex items-center justify-center flex-shrink-0 shadow-lg`}
                        >
                          <span className="font-cinzel font-bold text-xl text-parchment-100">
                            {character.name[0]}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-quattro font-bold text-lg text-ink-800">
                            {character.name}
                          </h3>
                          {character.description && (
                            <p className="font-crimson text-sm text-ink-600 mt-1 line-clamp-2">
                              {character.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {character.personality && (
                        <p className="font-crimson text-sm text-ink-500 mt-3 italic line-clamp-3">
                          &ldquo;{character.personality}&rdquo;
                        </p>
                      )}

                      <div className="mt-4">
                        <OrnateButton
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/speak/${character.id}`)}
                        >
                          🗣️ Talk to {character.name.split(" ")[0]}!
                        </OrnateButton>
                      </div>
                    </div>
                  </ParchmentCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
