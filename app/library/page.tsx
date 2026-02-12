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
  speakingVideoUrl: string | null;
  videoStatus: string;
  sourceTitle: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  description: string | null;
  genre: string | null;
  analysis: string | null;
  sourceType: string;
  characters: Character[];
  _count: { characters: number };
  createdAt: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [standaloneCharacters, setStandaloneCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [addingCharacter, setAddingCharacter] = useState(false);
  const [newSource, setNewSource] = useState({ title: "", author: "", description: "", sourceType: "book" });
  const [newCharacter, setNewCharacter] = useState({ name: "", sourceTitle: "", sourceType: "cartoon" });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
      // Fetch standalone characters
      const charRes = await fetch("/api/characters/standalone");
      if (charRes.ok) {
        const charData = await charRes.json();
        setStandaloneCharacters(charData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.title || !newSource.author) return;
    setAddingSource(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      if (res.ok) {
        setNewSource({ title: "", author: "", description: "", sourceType: "book" });
        setShowAddSource(false);
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to add source:", error);
    } finally {
      setAddingSource(false);
    }
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharacter.name || !newCharacter.sourceTitle) return;
    setAddingCharacter(true);
    try {
      const res = await fetch("/api/characters/add-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCharacter),
      });
      if (res.ok) {
        setNewCharacter({ name: "", sourceTitle: "", sourceType: "cartoon" });
        setShowAddCharacter(false);
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to add character:", error);
    } finally {
      setAddingCharacter(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Remove this from your library?")) return;
    try {
      await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      setBooks(books.filter((b) => b.id !== bookId));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Collect all characters from books for the top section
  const bookCharacters = books.flatMap((b) =>
    b.characters.map((c) => ({ ...c, sourceTitle: c.sourceTitle || b.title }))
  );
  const allCharacters = [...standaloneCharacters, ...bookCharacters];

  const sourceTypeLabel = (t: string) =>
    t === "cartoon" ? "Cartoon" : t === "film" ? "Film" : "Book";

  return (
    <div className="storybook-page min-h-screen">
      {/* Navigation */}
      <nav className="relative z-20 border-b border-ink-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-cinzel font-bold text-xl tracking-wider">
            <span className="gold-shimmer">STORY</span>
            <span className="text-parchment-400 mx-1">·</span>
            <span className="text-parchment-300">PALS</span>
          </h1>
          <div className="flex items-center gap-4">
            <OrnateButton variant="ghost" size="sm" onClick={() => router.push("/")}>
              Home
            </OrnateButton>
            <OrnateButton variant="ghost" size="sm" onClick={() => router.push("/parent")} className="opacity-30 hover:opacity-100 transition-opacity">
              Parent
            </OrnateButton>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <IllustratedHeader title="Your Story Friends!" subtitle="Pick a friend to chat with!" />

        {/* Add buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <OrnateButton variant="primary" onClick={() => { setShowAddSource(!showAddSource); setShowAddCharacter(false); }}>
            {showAddSource ? "Close" : "📚 Add a Story, Book or Cartoon"}
          </OrnateButton>
          <OrnateButton variant="secondary" onClick={() => { setShowAddCharacter(!showAddCharacter); setShowAddSource(false); }}>
            {showAddCharacter ? "Close" : "🎭 Add a Character"}
          </OrnateButton>
        </div>

        {/* Add Source Form */}
        <AnimatePresence>
          {showAddSource && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="max-w-lg mx-auto mt-8">
                <ParchmentCard className="p-6">
                  <h3 className="font-cinzel font-semibold text-lg text-ink-800 text-center mb-4">Add a Story!</h3>
                  {addingSource ? (
                    <div className="py-8"><QuillLoading text="Finding characters..." /></div>
                  ) : (
                    <form onSubmit={handleAddSource} className="space-y-4">
                      {/* Source type selector */}
                      <div className="flex justify-center gap-2 mb-2">
                        {(["book", "film", "cartoon"] as const).map((t) => (
                          <button key={t} type="button" onClick={() => setNewSource({ ...newSource, sourceType: t })}
                            className={`font-cinzel text-xs px-4 py-2 rounded-full transition-all border ${newSource.sourceType === t ? "bg-gold-600/20 text-gold-400 border-gold-500/30" : "text-ink-500 border-ink-300/30 hover:border-ink-400"}`}>
                            {t === "book" ? "📚 Book" : t === "film" ? "🎥 Film" : "🎬 Cartoon"}
                          </button>
                        ))}
                      </div>
                      <ScrollInput label="Title" placeholder="e.g., Frozen, Harry Potter, The Lion King..." value={newSource.title} onChange={(e) => setNewSource({ ...newSource, title: e.target.value })} required />
                      <ScrollInput label="Creator / Author" placeholder="e.g., Disney, J.K. Rowling..." value={newSource.author} onChange={(e) => setNewSource({ ...newSource, author: e.target.value })} required />
                      <ScrollTextarea label="Description (optional)" placeholder="Tell us a bit about this story..." value={newSource.description} onChange={(e) => setNewSource({ ...newSource, description: e.target.value })} rows={2} />
                      <OrnateButton type="submit" variant="primary" className="w-full">Find Characters!</OrnateButton>
                    </form>
                  )}
                </ParchmentCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Character Form */}
        <AnimatePresence>
          {showAddCharacter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="max-w-lg mx-auto mt-8">
                <ParchmentCard className="p-6">
                  <h3 className="font-cinzel font-semibold text-lg text-ink-800 text-center mb-4">Add a Character!</h3>
                  {addingCharacter ? (
                    <div className="py-8"><QuillLoading text="Creating your friend..." /></div>
                  ) : (
                    <form onSubmit={handleAddCharacter} className="space-y-4">
                      <ScrollInput label="Character Name" placeholder="e.g., Elsa, Simba, Harry Potter..." value={newCharacter.name} onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })} required />
                      <ScrollInput label="From which story?" placeholder="e.g., Frozen, The Lion King..." value={newCharacter.sourceTitle} onChange={(e) => setNewCharacter({ ...newCharacter, sourceTitle: e.target.value })} required />
                      <div className="flex justify-center gap-2">
                        {(["cartoon", "book", "film"] as const).map((t) => (
                          <button key={t} type="button" onClick={() => setNewCharacter({ ...newCharacter, sourceType: t })}
                            className={`font-cinzel text-xs px-4 py-2 rounded-full transition-all border ${newCharacter.sourceType === t ? "bg-gold-600/20 text-gold-400 border-gold-500/30" : "text-ink-500 border-ink-300/30 hover:border-ink-400"}`}>
                            {t === "cartoon" ? "🎬 Cartoon" : t === "book" ? "📚 Book" : "🎥 Film"}
                          </button>
                        ))}
                      </div>
                      <OrnateButton type="submit" variant="primary" className="w-full">Add Character!</OrnateButton>
                    </form>
                  )}
                </ParchmentCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <InkDivider className="my-10" />

        {/* Loading */}
        {loading ? (
          <div className="py-16"><QuillLoading text="Opening the doors..." /></div>
        ) : allCharacters.length === 0 && books.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="font-cinzel font-semibold text-xl text-parchment-300 mb-2">No friends yet!</h3>
            <p className="font-crimson text-parchment-500 italic">Add your first story friend to get started!</p>
          </motion.div>
        ) : (
          <>
            {/* Characters section */}
            {allCharacters.length > 0 && (
              <div className="mb-12">
                <h2 className="font-cinzel font-bold text-xl text-parchment-200 text-center mb-6">Your Characters</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allCharacters.map((char, i) => (
                    <motion.div key={char.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <ParchmentCard hover onClick={() => router.push(`/speak/${char.id}`)}>
                        <div className="p-4 text-center">
                          <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden bg-ink-200/20 relative">
                            {char.videoStatus === "ready" && char.speakingVideoUrl ? (
                              <video src={char.speakingVideoUrl} muted playsInline loop autoPlay className="w-full h-full object-cover" />
                            ) : char.videoStatus === "generating" || char.videoStatus === "pending" ? (
                              <div className="w-full h-full flex items-center justify-center bg-ink-100/10">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full" />
                              </div>
                            ) : (
                              <img src={char.illustratedAvatar || "/character-placeholder.png"} alt={char.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <h4 className="font-quattro font-bold text-sm text-ink-800">{char.name}</h4>
                          <p className="font-crimson text-xs text-ink-500 italic mt-0.5">{char.sourceTitle}</p>
                          <OrnateButton variant="primary" size="sm" className="mt-2 w-full" onClick={(e) => { e.stopPropagation(); router.push(`/speak/${char.id}`); }}>
                            Talk to me!
                          </OrnateButton>
                        </div>
                      </ParchmentCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Books & Sources section */}
            {books.length > 0 && (
              <div>
                <h2 className="font-cinzel font-bold text-xl text-parchment-200 text-center mb-6">Your Stories</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book, i) => (
                    <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <ParchmentCard hover onClick={() => router.push(`/book/${book.id}`)}>
                        <div className="p-5">
                          <div className="relative mb-4 h-32 bg-gradient-to-br from-leather-400 to-leather-600 rounded-sm overflow-hidden flex items-center justify-center ornate-frame">
                            <div className="text-center px-4">
                              <span className="font-cinzel text-xs text-gold-300/80 uppercase tracking-wider">{sourceTypeLabel(book.sourceType)}</span>
                              <h3 className="font-cinzel font-bold text-sm text-parchment-100 leading-tight mt-1">{book.title}</h3>
                              <p className="font-crimson text-xs text-parchment-300 mt-1 italic">{book.author}</p>
                            </div>
                            <div className="absolute top-2 left-2 right-2 h-px bg-gold-400/30" />
                            <div className="absolute bottom-2 left-2 right-2 h-px bg-gold-400/30" />
                          </div>
                          <h3 className="font-quattro font-bold text-ink-800 text-lg leading-tight">{book.title}</h3>
                          <p className="font-crimson text-ink-500 text-sm italic mt-1">by {book.author}</p>
                          {book.analysis && <p className="font-crimson text-ink-600 text-sm mt-2 line-clamp-2">{book.analysis}</p>}
                          <div className="mt-3 flex items-center gap-2">
                            <span className="font-cinzel text-xs text-ink-400 uppercase tracking-wider">
                              {book._count.characters} character{book._count.characters !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <OrnateButton variant="secondary" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/book/${book.id}`); }}>
                              Explore
                            </OrnateButton>
                            <OrnateButton variant="secondary" size="sm" className="bg-gradient-to-b from-leather-500 to-leather-700 text-parchment-100 border-leather-800 hover:from-leather-400 hover:to-leather-600" onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}>
                              ✕
                            </OrnateButton>
                          </div>
                        </div>
                      </ParchmentCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
