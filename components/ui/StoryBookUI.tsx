"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ── Ornate Button ──────────────────────────────────────────────
interface OrnateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "wax";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function OrnateButton({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  ...props
}: OrnateButtonProps) {
  const baseStyles =
    "relative font-cinzel font-bold tracking-wider uppercase transition-all duration-300 rounded-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-b from-gold-400 to-gold-600 text-ink-900 border-gold-700 hover:from-gold-300 hover:to-gold-500 shadow-lg hover:shadow-gold-500/30",
    secondary:
      "bg-parchment-100 text-ink-800 border-ink-300 hover:bg-parchment-200 hover:border-ink-400 shadow-md",
    ghost:
      "bg-transparent text-parchment-200 border-parchment-400/30 hover:bg-parchment-100/10 hover:border-parchment-300/50",
    wax: "bg-gradient-to-b from-red-700 to-red-900 text-parchment-100 border-red-950 hover:from-red-600 hover:to-red-800 shadow-lg rounded-full",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ── Parchment Card ────────────────────────────────────────────
interface ParchmentCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function ParchmentCard({
  children,
  className,
  hover = false,
  onClick,
}: ParchmentCardProps) {
  const Component = hover ? motion.div : "div";

  return (
    <Component
      className={cn(
        "relative bg-gradient-to-br from-parchment-100 to-parchment-200 rounded-sm border border-ink-200/30 shadow-lg overflow-hidden",
        "before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] before:opacity-50 before:pointer-events-none",
        hover && "cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...(hover
        ? {
            whileHover: { scale: 1.02, y: -4 },
            transition: { type: "spring", stiffness: 300 },
          }
        : {})}
    >
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

// ── Ink Divider ───────────────────────────────────────────────
export function InkDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 my-6", className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-ink-300/40 to-transparent" />
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="text-ink-400/60"
      >
        <path
          d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8Z"
          fill="currentColor"
        />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-ink-300/40 to-transparent" />
    </div>
  );
}

// ── Scroll Input (Textarea styled like a scroll) ──────────────
interface ScrollInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function ScrollInput({
  label,
  error,
  className,
  ...props
}: ScrollInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-cinzel font-semibold text-ink-700 tracking-wide">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3 bg-parchment-50 border-2 border-ink-200/40 rounded-sm",
          "font-crimson text-ink-800 placeholder:text-ink-400/60",
          "focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20",
          "transition-all duration-300",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs font-crimson text-red-600 italic">{error}</p>
      )}
    </div>
  );
}

// ── Scroll Textarea ───────────────────────────────────────────
interface ScrollTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function ScrollTextarea({
  label,
  error,
  className,
  ...props
}: ScrollTextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-cinzel font-semibold text-ink-700 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-parchment-50 border-2 border-ink-200/40 rounded-sm",
          "font-crimson text-ink-800 placeholder:text-ink-400/60",
          "focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20",
          "transition-all duration-300 resize-none",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs font-crimson text-red-600 italic">{error}</p>
      )}
    </div>
  );
}

// ── Illustrated Header ────────────────────────────────────────
interface IllustratedHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function IllustratedHeader({
  title,
  subtitle,
  className,
}: IllustratedHeaderProps) {
  return (
    <div className={cn("text-center space-y-3", className)}>
      {/* Ornamental top flourish */}
      <div className="flex justify-center">
        <svg
          width="120"
          height="24"
          viewBox="0 0 120 24"
          className="text-gold-500/70"
        >
          <path
            d="M0 12 C20 2, 40 22, 60 12 C80 2, 100 22, 120 12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="60" cy="12" r="3" fill="currentColor" />
        </svg>
      </div>

      <h1 className="font-cinzel font-bold text-3xl md:text-4xl text-ink-800 tracking-wide">
        {title}
      </h1>

      {subtitle && (
        <p className="font-crimson text-lg text-ink-500 italic">{subtitle}</p>
      )}

      {/* Ornamental bottom flourish */}
      <div className="flex justify-center">
        <svg
          width="120"
          height="24"
          viewBox="0 0 120 24"
          className="text-gold-500/70"
        >
          <path
            d="M0 12 C20 22, 40 2, 60 12 C80 22, 100 2, 120 12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

// ── Book Spine (for bookshelf display) ────────────────────────
interface BookSpineProps {
  title: string;
  author: string;
  color?: string;
  onClick?: () => void;
}

export function BookSpine({ title, author, color, onClick }: BookSpineProps) {
  const spineColors = [
    "from-leather-400 to-leather-600",
    "from-forest-500 to-forest-700",
    "from-deep-blue-500 to-deep-blue-700",
    "from-red-800 to-red-950",
    "from-gold-600 to-gold-800",
    "from-moss-500 to-moss-700",
  ];

  const spineColor =
    color || spineColors[title.length % spineColors.length];

  return (
    <motion.div
      className={cn(
        "relative h-52 w-12 rounded-r-sm cursor-pointer",
        "bg-gradient-to-b shadow-md",
        spineColor,
        "border-l-2 border-black/20"
      )}
      whileHover={{ y: -8, rotateZ: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
        <span className="text-[7px] font-cinzel font-bold text-parchment-100/90 writing-mode-vertical tracking-widest uppercase text-center [writing-mode:vertical-lr] rotate-180">
          {title.slice(0, 20)}
        </span>
      </div>
      {/* Gold line embellishments */}
      <div className="absolute top-3 left-1 right-1 h-px bg-gold-400/40" />
      <div className="absolute bottom-3 left-1 right-1 h-px bg-gold-400/40" />
    </motion.div>
  );
}

// ── Magical Mic Button ────────────────────────────────────────
interface MagicalMicButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MagicalMicButton({
  isListening,
  onClick,
  disabled,
}: MagicalMicButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative w-20 h-20 rounded-full flex items-center justify-center",
        "transition-all duration-300",
        isListening
          ? "bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/40"
          : "bg-gradient-to-br from-gold-500 to-gold-700 shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Pulsing ring when listening */}
      {isListening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Mic icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white relative z-10"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </motion.button>
  );
}

// ── Audio Waveform Visualization ──────────────────────────────
export function AudioWaveform({
  isActive,
  className,
}: {
  isActive: boolean;
  className?: string;
}) {
  const bars = 12;

  return (
    <div className={cn("flex items-center gap-0.5 h-8", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-gold-600 to-gold-400 rounded-full"
          animate={
            isActive
              ? {
                  height: [4, Math.random() * 28 + 4, 4],
                }
              : { height: 4 }
          }
          transition={
            isActive
              ? {
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ── Loading Spinner (Quill themed) ────────────────────────────
export function QuillLoading({
  text = "Inscribing...",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="text-gold-600"
        >
          <path
            d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="16"
            y1="8"
            x2="2"
            y2="22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="17.5"
            y1="15"
            x2="9"
            y2="15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <p className="font-crimson text-ink-500 italic text-sm animate-pulse">
        {text}
      </p>
    </div>
  );
}
