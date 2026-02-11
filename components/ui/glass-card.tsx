"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  className,
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl",
        "transition-colors duration-300",
        hover && "hover:border-purple-500/30 hover:bg-white/[0.08]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
