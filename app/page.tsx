"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse [animation-delay:2s]" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-800 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse [animation-delay:4s]" />
      </div>

      {/* Hero Section */}
      <section className="container relative py-24 md:py-32 lg:py-40">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Literary Conversations
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="block text-foreground">Bring Books to</span>
            <span className="block gradient-text mt-2">Life with AI</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Chat with your favorite book characters powered by advanced AI.
            Explore new perspectives, dive deeper into stories, and experience
            literature like never before.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {session ? (
              <Button variant="gradient" size="xl" asChild>
                <Link href="/dashboard" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup" className="gap-2">
                    Start Reading Alive
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid gap-6 md:grid-cols-3"
        >
          <motion.div variants={fadeInUp}>
            <GlassCard className="p-6 h-full" hover={false}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-bg mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                AI Book Analysis
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Add any book and our AI instantly extracts characters, their
                personalities, speaking styles, and key relationships.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <GlassCard className="p-6 h-full" hover={false}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-bg mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Living Characters
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Each character stays true to their personality, speaking style,
                and story context. They remember your conversations.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <GlassCard className="p-6 h-full" hover={false}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-bg mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Real-time Chat
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Experience smooth, streaming conversations. Ask questions, debate
                ideas, or just have a friendly chat with literary legends.
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            How It <span className="gradient-text">Works</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto"
        >
          {[
            {
              step: "1",
              icon: BookOpen,
              title: "Add a Book",
              description:
                "Enter any book title and author. Our AI analyzes the text and extracts all major characters.",
            },
            {
              step: "2",
              icon: Users,
              title: "Meet Characters",
              description:
                "Browse the extracted characters with their unique personalities, traits, and speaking styles.",
            },
            {
              step: "3",
              icon: Zap,
              title: "Start Chatting",
              description:
                "Pick a character and start a conversation. They'll respond in character, referencing events from the book.",
            },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeInUp} className="text-center">
              <div className="relative mx-auto mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 mx-auto">
                  <item.icon className="h-7 w-7 text-purple-400" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full gradient-bg text-xs font-bold text-white">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <GlassCard className="p-12 text-center" hover={false}>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to <span className="gradient-text">Explore?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join BookAlive and start having meaningful conversations with the
            characters that shaped your imagination.
          </p>
          <Button variant="gradient" size="xl" asChild>
            <Link href={session ? "/dashboard" : "/signup"} className="gap-2">
              {session ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-bg">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text">
              BookAlive
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BookAlive. Powered by AI. Built
            with love for literature.
          </p>
        </div>
      </footer>
    </div>
  );
}
