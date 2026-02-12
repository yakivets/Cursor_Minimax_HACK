"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  OrnateButton,
  ParchmentCard,
  ScrollInput,
  ScrollTextarea,
  IllustratedHeader,
  InkDivider,
  QuillLoading,
} from "@/components/ui/StoryBookUI";

interface Character {
  id: string;
  name: string;
  illustratedAvatar: string | null;
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
  _count: { characters: number };
  createdAt: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    description: "",
  });

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;
    setAddingBook(true);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBook),
      });

      if (res.ok) {
        setNewBook({ title: "", author: "", description: "" });
        setShowAddBook(false);
        await fetchBooks();
      }
    } catch (error) {
      console.error("Failed to add book:", error);
    } finally {
      setAddingBook(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Remove this book from your library?")) return;

    try {
      await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      setBooks(books.filter((b) => b.id !== bookId));
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  };

  return (
    <div className="storybook-page min-h-screen">
      {/* Navigation */}
      <nav className="relative z-20 border-b border-ink-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-cinzel font-bold text-xl tracking-wider">
            <span className="gold-shimmer">LORE</span>
            <span className="text-parchment-400 mx-1">·</span>
            <span className="text-parchment-300">ECHO</span>
          </h1>

          <div className="flex items-center gap-4">
            <span className="font-crimson text-sm text-parchment-500 hidden sm:block">
              Welcome, Reader
            </span>
            <OrnateButton
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
            >
              Leave Library
            </OrnateButton>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <IllustratedHeader
          title="Your Library"
          subtitle="Each book holds characters yearning to speak"
        />

        <div className="mt-8 flex justify-center">
          <OrnateButton
            variant="primary"
            onClick={() => setShowAddBook(!showAddBook)}
          >
            {showAddBook ? "Close" : "✦ Add a Book"}
          </OrnateButton>
        </div>

        {/* Add Book Form */}
        <AnimatePresence>
          {showAddBook && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-lg mx-auto mt-8">
                <ParchmentCard className="p-6">
                  <h3 className="font-cinzel font-semibold text-lg text-ink-800 text-center mb-4">
                    Summon a New Volume
                  </h3>

                  {addingBook ? (
                    <div className="py-8">
                      <QuillLoading text="The AI is reading your book and meeting its characters..." />
                    </div>
                  ) : (
                    <form onSubmit={handleAddBook} className="space-y-4">
                      <ScrollInput
                        label="Book Title"
                        placeholder="e.g., Pride and Prejudice"
                        value={newBook.title}
                        onChange={(e) =>
                          setNewBook({ ...newBook, title: e.target.value })
                        }
                        required
                      />

                      <ScrollInput
                        label="Author"
                        placeholder="e.g., Jane Austen"
                        value={newBook.author}
                        onChange={(e) =>
                          setNewBook({ ...newBook, author: e.target.value })
                        }
                        required
                      />

                      <ScrollTextarea
                        label="Description (optional)"
                        placeholder="A brief description to help the AI understand the book better..."
                        value={newBook.description}
                        onChange={(e) =>
                          setNewBook({
                            ...newBook,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />

                      <OrnateButton
                        type="submit"
                        variant="primary"
                        className="w-full"
                      >
                        Add to Library
                      </OrnateButton>
                    </form>
                  )}
                </ParchmentCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <InkDivider className="my-10" />

        {/* Books Grid */}
        {loading ? (
          <div className="py-16">
            <QuillLoading text="Opening the library doors..." />
          </div>
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="font-cinzel font-semibold text-xl text-parchment-300 mb-2">
              Your shelves are empty
            </h3>
            <p className="font-crimson text-parchment-500 italic">
              Add your first book to begin conversing with its characters
            </p>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ParchmentCard hover onClick={() => router.push(`/book/${book.id}`)}>
                  <div className="p-5">
                    {/* Book cover visual */}
                    <div className="relative mb-4 h-32 bg-gradient-to-br from-leather-400 to-leather-600 rounded-sm overflow-hidden flex items-center justify-center ornate-frame">
                      <div className="text-center px-4">
                        <h3 className="font-cinzel font-bold text-sm text-parchment-100 leading-tight">
                          {book.title}
                        </h3>
                        <p className="font-crimson text-xs text-parchment-300 mt-1 italic">
                          {book.author}
                        </p>
                      </div>
                      {/* Gold embellishment */}
                      <div className="absolute top-2 left-2 right-2 h-px bg-gold-400/30" />
                      <div className="absolute bottom-2 left-2 right-2 h-px bg-gold-400/30" />
                    </div>

                    {/* Info */}
                    <h3 className="font-quattro font-bold text-ink-800 text-lg leading-tight">
                      {book.title}
                    </h3>
                    <p className="font-crimson text-ink-500 text-sm italic mt-1">
                      by {book.author}
                    </p>

                    {book.analysis && (
                      <p className="font-crimson text-ink-600 text-sm mt-2 line-clamp-2">
                        {book.analysis}
                      </p>
                    )}

                    {/* Characters preview */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-cinzel text-xs text-ink-400 uppercase tracking-wider">
                        {book._count.characters} character
                        {book._count.characters !== 1 ? "s" : ""}
                      </span>
                      {book.characters.slice(0, 3).map((char) => (
                        <span
                          key={char.id}
                          className="inline-block w-6 h-6 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-[8px] font-cinzel font-bold text-parchment-100"
                          title={char.name}
                        >
                          {char.name[0]}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <OrnateButton
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/book/${book.id}`);
                        }}
                      >
                        Open Book
                      </OrnateButton>
                      <OrnateButton
                        variant="secondary"
                        size="sm"
                        className="bg-gradient-to-b from-leather-500 to-leather-700 text-parchment-100 border-leather-800 hover:from-leather-400 hover:to-leather-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBook(book.id);
                        }}
                      >
                        ✕
                      </OrnateButton>
                    </div>
                  </div>
                </ParchmentCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
