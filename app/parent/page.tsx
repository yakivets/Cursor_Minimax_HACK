"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ParentPinGate } from "@/components/security/ParentPinGate";
import { OrnateButton } from "@/components/ui/StoryBookUI";

interface MessageData {
  id: string;
  content: string;
  role: string;
  emotionalState: string | null;
  createdAt: string;
}

interface ConversationData {
  id: string;
  title: string | null;
  createdAt: string;
  endedAt: string | null;
  durationSecs: number | null;
  character: { name: string; sourceTitle: string | null };
  messages: MessageData[];
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  totalDuration: number;
  topCharacter: string;
}

interface KidProfile {
  name: string;
  age: string;
  interests: string;
  favourites: string;
  notes: string;
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

export default function ParentDashboard() {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emptyProfile: KidProfile = { name: "", age: "", interests: "", favourites: "", notes: "" };
  const [kidProfile, setKidProfile] = useState<KidProfile>(emptyProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!isUnlocked) return;

    const fetchData = async () => {
      try {
        const [convRes, profileRes] = await Promise.all([
          fetch("/api/parent/conversations"),
          fetch("/api/parent/kid-profile"),
        ]);
        if (convRes.ok) {
          const data = await convRes.json();
          setConversations(data.conversations);
          setStats(data.stats);
        }
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.profile) setKidProfile(data.profile);
        }
      } catch (err) {
        console.error("Failed to fetch parent data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isUnlocked]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/parent/kid-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: kidProfile }),
      });
      if (res.ok) setProfileSaved(true);
    } catch (err) {
      console.error("Failed to save kid profile:", err);
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  if (!isUnlocked) {
    return (
      <ParentPinGate
        mode="enter"
        onSuccess={() => setIsUnlocked(true)}
        onCancel={() => router.push("/library")}
      />
    );
  }

  const inputClasses =
    "w-full px-4 py-2.5 bg-parchment-50 border-2 border-ink-200/40 rounded-sm font-crimson text-ink-800 placeholder:text-ink-400/60 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20 transition-all duration-300 text-sm";

  return (
    <div className="storybook-page min-h-screen">
      {/* Header */}
      <nav className="relative z-20 border-b border-ink-700/30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-cinzel font-bold text-xl tracking-wider">
            <span className="gold-shimmer">PARENT</span>
            <span className="text-parchment-400 mx-1">&middot;</span>
            <span className="text-parchment-300">DASHBOARD</span>
          </h1>
          <OrnateButton variant="ghost" size="sm" onClick={() => router.push("/library")}>
            Back to App
          </OrnateButton>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 font-crimson text-parchment-500 italic">Loading...</div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Conversations", value: stats.totalConversations },
                  { label: "Messages", value: stats.totalMessages },
                  { label: "Time Spent", value: formatDuration(stats.totalDuration) },
                  { label: "Favourite Character", value: stats.topCharacter },
                ].map((s) => (
                  <div key={s.label} className="bg-parchment-100/10 rounded-sm p-4 border border-ink-700/20 shadow-sm">
                    <p className="text-xs font-cinzel text-parchment-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-xl font-quattro font-bold text-parchment-200 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Conversations */}
            <h2 className="font-cinzel font-semibold text-lg text-parchment-200 mb-4">Conversation History</h2>

            {conversations.length === 0 ? (
              <p className="font-crimson text-parchment-500 italic text-center py-10">No conversations yet.</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((convo) => (
                  <div key={convo.id} className="bg-parchment-100/10 rounded-sm border border-ink-700/20 shadow-sm overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-parchment-100/15 transition-colors"
                      onClick={() => setExpandedId(expandedId === convo.id ? null : convo.id)}
                    >
                      <div>
                        <p className="font-quattro font-bold text-parchment-200">
                          {convo.character.name}
                          <span className="font-crimson text-parchment-500 text-sm ml-2 font-normal italic">
                            from {convo.character.sourceTitle || "Unknown"}
                          </span>
                        </p>
                        <p className="font-crimson text-xs text-parchment-600 mt-0.5">
                          {new Date(convo.createdAt).toLocaleDateString()}{" "}
                          {new Date(convo.createdAt).toLocaleTimeString()} &middot;{" "}
                          {convo.messages.length} messages
                          {convo.durationSecs ? ` · ${formatDuration(convo.durationSecs)}` : ""}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-parchment-500 transition-transform ${expandedId === convo.id ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <AnimatePresence>
                      {expandedId === convo.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-ink-700/20"
                        >
                          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                            {convo.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`font-crimson text-sm p-2.5 rounded-sm ${
                                  msg.role === "user"
                                    ? "bg-forest-900/20 text-parchment-300 ml-8 border border-forest-700/20"
                                    : "bg-ink-800/40 text-parchment-300 mr-8 border border-ink-700/20"
                                }`}
                              >
                                <span className="font-quattro font-bold text-xs text-parchment-400">
                                  {msg.role === "user" ? "Child" : convo.character.name}
                                </span>
                                <p className="mt-0.5">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* Kid Profile */}
            <div className="mt-10 pt-6 border-t border-ink-700/30">
              <h2 className="font-cinzel font-semibold text-lg text-parchment-200 mb-1">About Your Child</h2>
              <p className="font-crimson text-sm text-parchment-500 italic mb-5">
                Characters will use this info to personalise conversations — greet your child by name, reference their hobbies, etc.
              </p>

              <div className="bg-parchment-100/10 rounded-sm border border-ink-700/20 shadow-sm p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-cinzel font-semibold text-parchment-400 tracking-wide mb-1">Child&apos;s Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Emma"
                      value={kidProfile.name}
                      onChange={(e) => setKidProfile({ ...kidProfile, name: e.target.value })}
                      className={inputClasses}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-cinzel font-semibold text-parchment-400 tracking-wide mb-1">Age</label>
                    <input
                      type="text"
                      placeholder="e.g. 7"
                      value={kidProfile.age}
                      onChange={(e) => setKidProfile({ ...kidProfile, age: e.target.value })}
                      className={inputClasses}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-parchment-400 tracking-wide mb-1">Interests &amp; Hobbies</label>
                  <textarea
                    placeholder="e.g. loves dinosaurs, drawing, and playing football"
                    value={kidProfile.interests}
                    onChange={(e) => setKidProfile({ ...kidProfile, interests: e.target.value })}
                    className={`${inputClasses} resize-none`}
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-parchment-400 tracking-wide mb-1">Favourite Things</label>
                  <textarea
                    placeholder="e.g. favourite colour is purple, loves pizza, favourite animal is a penguin"
                    value={kidProfile.favourites}
                    onChange={(e) => setKidProfile({ ...kidProfile, favourites: e.target.value })}
                    className={`${inputClasses} resize-none`}
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-parchment-400 tracking-wide mb-1">Anything else characters should know?</label>
                  <textarea
                    placeholder="e.g. just started Year 2 at school, has a pet cat called Whiskers"
                    value={kidProfile.notes}
                    onChange={(e) => setKidProfile({ ...kidProfile, notes: e.target.value })}
                    className={`${inputClasses} resize-none`}
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <OrnateButton
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </OrnateButton>
                  {profileSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-crimson text-sm text-gold-400 font-medium italic"
                    >
                      Saved!
                    </motion.span>
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="mt-10 pt-6 border-t border-ink-700/30">
              <h2 className="font-cinzel font-semibold text-lg text-parchment-200 mb-4">Settings</h2>
              <OrnateButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("This will reset your parent PIN. You'll set a new one next time.")) {
                    fetch("/api/security/reset-pin", { method: "POST" });
                    alert("PIN has been reset.");
                  }
                }}
              >
                Reset Parent PIN
              </OrnateButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
