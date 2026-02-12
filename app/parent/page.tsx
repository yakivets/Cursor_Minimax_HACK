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

  useEffect(() => {
    if (!isUnlocked) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/parent/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch parent data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isUnlocked]);

  if (!isUnlocked) {
    return (
      <ParentPinGate
        mode="enter"
        onSuccess={() => setIsUnlocked(true)}
        onCancel={() => router.push("/library")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <nav className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Parent Dashboard</h1>
          <button
            onClick={() => router.push("/library")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to App
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
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
                  <div key={s.label} className="bg-white rounded-lg p-4 border shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Conversations */}
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Conversation History</h2>

            {conversations.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No conversations yet.</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((convo) => (
                  <div key={convo.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === convo.id ? null : convo.id)}
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {convo.character.name}
                          <span className="text-gray-400 text-sm ml-2">
                            from {convo.character.sourceTitle || "Unknown"}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(convo.createdAt).toLocaleDateString()}{" "}
                          {new Date(convo.createdAt).toLocaleTimeString()} &middot;{" "}
                          {convo.messages.length} messages
                          {convo.durationSecs ? ` · ${formatDuration(convo.durationSecs)}` : ""}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === convo.id ? "rotate-180" : ""}`}
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
                          className="overflow-hidden border-t"
                        >
                          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                            {convo.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`text-sm p-2 rounded ${
                                  msg.role === "user"
                                    ? "bg-blue-50 text-blue-900 ml-8"
                                    : "bg-gray-50 text-gray-800 mr-8"
                                }`}
                              >
                                <span className="font-medium text-xs">
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

            {/* Settings */}
            <div className="mt-10 pt-6 border-t">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Settings</h2>
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
