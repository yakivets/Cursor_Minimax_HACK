# BookAlive - AI-Powered Book Character Chat

An immersive reading companion where you can chat with AI-powered book characters. Built with Next.js 14, Tailwind CSS, Prisma, and OpenAI.

## Features

- **AI Book Analysis**: Add any book and our AI extracts characters with their personalities, speaking styles, and relationships
- **Character Chat**: Have real-time streaming conversations with book characters who stay in character
- **Modern UI**: Dark glassmorphism design with smooth Framer Motion animations
- **Authentication**: Full login/signup flow with NextAuth.js
- **Conversation History**: All chats are saved and can be resumed

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Credentials)
- **AI**: OpenAI GPT-4 Turbo
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - A random secret for NextAuth
   - `OPENAI_API_KEY` - Your OpenAI API key

3. **Set up the database:**
   ```bash
   npx prisma db push
   ```

4. **Seed sample data (optional):**
   ```bash
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

### Demo Account

If you ran the seed script, you can log in with:
- Email: `demo@bookalive.com`
- Password: `demo123`

## Project Structure

```
├── app/
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── books/         # Book CRUD & analysis
│   │   ├── characters/    # Character endpoints
│   │   ├── chat/          # Streaming chat API
│   │   ├── conversations/ # Conversation management
│   │   └── signup/        # User registration
│   ├── book/[id]/         # Book detail page
│   ├── chat/[characterId]/ # Chat interface
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── profile/           # User profile
├── components/
│   ├── ui/                # Reusable UI components
│   ├── book/              # Book-related components
│   ├── chat/              # Chat components
│   └── navbar.tsx         # Navigation bar
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   ├── openai.ts          # OpenAI helpers
│   └── utils.ts           # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
└── middleware.ts           # Auth middleware
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for JWT encryption |
| `NEXTAUTH_URL` | Base URL of your app |
| `OPENAI_API_KEY` | OpenAI API key |
