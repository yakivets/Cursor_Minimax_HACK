"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface CharacterCardProps {
  id: string;
  name: string;
  role?: string | null;
  personalityTraits?: string | null;
  avatarUrl?: string | null;
  bookTitle: string;
  speakingStyle?: string | null;
}

export function CharacterCard({
  id,
  name,
  role,
  personalityTraits,
  avatarUrl,
  bookTitle,
  speakingStyle,
}: CharacterCardProps) {
  const traits = personalityTraits
    ? JSON.parse(personalityTraits).slice(0, 3)
    : [];

  return (
    <Link href={`/chat/${id}`}>
      <GlassCard className="group cursor-pointer p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-purple-500/30">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white font-serif text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-bold text-foreground">
              {name}
            </h3>
            {role && (
              <p className="text-sm text-purple-400">{role}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              from {bookTitle}
            </p>
          </div>
          <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
        </div>
        {traits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {traits.map((trait: string) => (
              <Badge key={trait} variant="purple" className="text-[10px]">
                {trait}
              </Badge>
            ))}
          </div>
        )}
        {speakingStyle && (
          <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
            &ldquo;{speakingStyle}&rdquo;
          </p>
        )}
      </GlassCard>
    </Link>
  );
}
