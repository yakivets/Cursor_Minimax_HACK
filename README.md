# 📖 LORE ECHO

> *"Every great character has a story to tell. Now they can tell it to you."*

**Lore Echo** is an immersive storytelling platform where readers can have voice conversations with AI-powered book characters in a beautiful, storybook-inspired interface.

## ✨ Features

- **📚 Personal Library** — Add any book and let AI analyze it to extract characters
- **🎭 Character Conversations** — Chat with characters who stay perfectly in-character
- **🗣️ Voice Input** — Speak naturally using your microphone (Web Speech API)
- **🔊 Voice Output** — Characters respond with unique voices (ElevenLabs TTS)
- **😊 Emotion Detection** — AI detects character emotions, reflected in the UI
- **🎬 Video Reactions** — Animated character responses (Minimax Video API)
- **📜 Storybook Aesthetic** — Parchment textures, ornate frames, gold accents

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, SQLite
- **AI:** OpenAI GPT-4o-mini (chat + analysis + emotion)
- **Voice:** ElevenLabs (TTS), Web Speech API (STT)
- **Video:** Minimax API (character animation)
- **Auth:** NextAuth.js (credentials)

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Initialize database
npx prisma generate
npx prisma db push

# 4. Seed demo data (optional)
node prisma/seed.js

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo Login:** `reader@loreecho.com` / `password123`

## 🔑 API Keys Needed

| Service | Purpose | Required? |
|---------|---------|-----------|
| OpenAI | Chat, analysis, emotion detection | **Yes** |
| ElevenLabs | Character voice generation | Optional |
| Minimax | Character video animation | Optional |

The app works with just an OpenAI key — voice and video features gracefully degrade when not configured.

## 📁 Project Structure

```
├── app/
│   ├── api/          # API routes (auth, books, chat, characters)
│   ├── book/[id]/    # Book detail & character selection
│   ├── library/      # Personal bookshelf dashboard
│   ├── login/        # "Enter the Library"
│   ├── signup/       # "Begin Your Journey"
│   └── speak/[id]/   # Voice chat with characters
├── components/ui/    # Storybook-themed UI components
├── lib/
│   ├── ai/           # OpenAI, Minimax, ElevenLabs integrations
│   └── voice/        # Speech recognition & audio playback
├── prisma/           # Database schema & seed data
└── types/            # TypeScript declarations
```

## 🎨 Design Philosophy

Lore Echo uses a "living storybook" aesthetic:
- **Warm earthy tones** — parchment, ink, leather, forest green
- **Gold accents** — ornate dividers, shimmer effects
- **Custom fonts** — Cinzel (headings), Crimson Text (body), Quattrocento (names)
- **Atmospheric animations** — floating particles, ink flow, page turns
