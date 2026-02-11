"use client";

import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users } from "lucide-react";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  genre?: string | null;
  characterCount?: number;
}

export function BookCard({
  id,
  title,
  author,
  coverImageUrl,
  genre,
  characterCount = 0,
}: BookCardProps) {
  return (
    <Link href={`/book/${id}`}>
      <GlassCard className="group overflow-hidden cursor-pointer">
        <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-900/40 to-blue-900/40">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-purple-400/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="p-4">
          <h3 className="font-serif text-lg font-bold text-foreground line-clamp-1">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">by {author}</p>
          <div className="mt-3 flex items-center gap-2">
            {genre && <Badge variant="purple">{genre}</Badge>}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {characterCount} character{characterCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
