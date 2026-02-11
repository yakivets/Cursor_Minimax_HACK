"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  OrnateButton,
  ScrollInput,
  ParchmentCard,
  InkDivider,
} from "@/components/ui/StoryBookUI";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/library");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="storybook-page min-h-screen flex items-center justify-center px-6 relative">
      {/* Ambient particles */}
      <div className="particle-field">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold-400/15"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ y: [-10, -60], opacity: [0, 0.5, 0] }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-cinzel font-bold text-3xl tracking-wider">
              <span className="gold-shimmer">LORE</span>
              <span className="text-parchment-400 mx-2">·</span>
              <span className="text-parchment-300">ECHO</span>
            </h1>
          </Link>
        </div>

        <ParchmentCard className="p-8">
          <div className="text-center mb-6">
            <h2 className="font-cinzel font-bold text-2xl text-ink-800 mb-2">
              Enter the Library
            </h2>
            <p className="font-crimson text-ink-500 italic">
              The characters await your return
            </p>
          </div>

          <InkDivider />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 mb-4"
            >
              <p className="text-red-700 text-sm font-crimson">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <ScrollInput
              label="Email Address"
              type="email"
              placeholder="reader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <ScrollInput
              label="Password"
              type="password"
              placeholder="Your secret passphrase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <OrnateButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Unlock the Door
            </OrnateButton>
          </form>

          <InkDivider />

          <p className="text-center font-crimson text-ink-500">
            New to Lore Echo?{" "}
            <Link
              href="/signup"
              className="text-forest-600 hover:text-forest-700 font-semibold underline underline-offset-2 decoration-forest-400/50"
            >
              Begin Your Journey
            </Link>
          </p>
        </ParchmentCard>
      </motion.div>
    </div>
  );
}
