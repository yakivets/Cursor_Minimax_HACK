"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrnateButton } from "@/components/ui/StoryBookUI";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/library");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="storybook-page flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="storybook-page min-h-screen relative overflow-hidden">
      {/* Ambient particles */}
      <div className="particle-field">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Book opening animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center space-y-8"
        >
          {/* Ornamental top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex justify-center"
          >
            <svg
              width="200"
              height="40"
              viewBox="0 0 200 40"
              className="text-gold-500/60"
            >
              <path
                d="M10 20 C40 5, 70 35, 100 20 C130 5, 160 35, 190 20"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="100" cy="20" r="4" fill="currentColor" />
              <circle cx="40" cy="15" r="2" fill="currentColor" opacity="0.5" />
              <circle cx="160" cy="15" r="2" fill="currentColor" opacity="0.5" />
            </svg>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <h1 className="font-cinzel font-bold text-6xl md:text-8xl tracking-wider">
              <span className="gold-shimmer">LORE</span>
              <span className="text-parchment-300 mx-3">·</span>
              <span className="text-parchment-200">ECHO</span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="font-crimson text-xl md:text-2xl text-parchment-400 italic max-w-lg mx-auto"
          >
            &ldquo;Every great character has a story to tell.
            <br />
            Now they can tell it to you.&rdquo;
          </motion.p>

          {/* Decorative divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="w-64 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent mx-auto"
          />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="font-crimson text-lg text-parchment-500 max-w-md mx-auto"
          >
            Have voice conversations with characters from your favorite books.
            Listen to them speak. Watch them react. Step into the story.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Link href="/signup">
              <OrnateButton variant="primary" size="lg">
                Begin Your Journey
              </OrnateButton>
            </Link>
            <Link href="/login">
              <OrnateButton variant="ghost" size="lg">
                Enter the Library
              </OrnateButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom flourish */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-parchment-500/50"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </motion.div>
          <span className="font-crimson text-xs text-parchment-600 tracking-widest uppercase">
            Scroll to explore
          </span>
        </motion.div>
      </div>

      {/* Feature Section */}
      <div className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-cinzel font-bold text-3xl text-parchment-200 mb-4">
              How the Magic Works
            </h2>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: "📚",
                title: "Add Your Books",
                description:
                  "Add any book to your library. Our AI will analyze it and bring its characters to life.",
              },
              {
                icon: "🎭",
                title: "Choose a Character",
                description:
                  "Each character has their own personality, voice, and emotional responses true to the source.",
              },
              {
                icon: "🗣️",
                title: "Start Talking",
                description:
                  "Have natural voice conversations. They speak back with unique voices and animated expressions.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="text-center space-y-4"
              >
                <div className="text-5xl">{feature.icon}</div>
                <h3 className="font-cinzel font-semibold text-lg text-gold-400">
                  {feature.title}
                </h3>
                <p className="font-crimson text-parchment-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-8 text-center border-t border-ink-700/50">
        <p className="font-crimson text-sm text-parchment-600">
          Lore Echo — Where stories find their voice
        </p>
      </div>
    </div>
  );
}
