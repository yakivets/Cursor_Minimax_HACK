"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { OrnateButton } from "@/components/ui/StoryBookUI";

interface PinGateProps {
  mode: "enter" | "exit";
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ParentPinGate({ mode, onSuccess, onCancel }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length < 4) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/security/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setError("Wrong password! Try again");
        setPin("");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberPress = (n: number) => {
    if (pin.length < 4) setPin((prev) => prev + n);
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/95 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xs text-center"
      >
        {/* Lock icon */}
        <div className="text-5xl mb-4">
          {mode === "enter" ? "🔐" : "🔓"}
        </div>

        <h2 className="font-cinzel font-bold text-xl text-parchment-200 mb-2">
          {mode === "enter" ? "Ask a Grown-Up!" : "Parent Check"}
        </h2>
        <p className="font-crimson text-sm text-parchment-500 mb-6">
          {mode === "enter"
            ? "A parent needs to enter the PIN"
            : "Enter your PIN to continue"}
        </p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length
                  ? "bg-gold-400 border-gold-500"
                  : "bg-transparent border-parchment-500/40"
              }`}
              animate={i < pin.length ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-crimson text-sm text-red-400 mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleNumberPress(n)}
              className="w-full h-14 rounded-lg bg-ink-800/50 border border-ink-700/50 text-parchment-200 font-cinzel font-bold text-xl hover:bg-ink-700/50 active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="w-full h-14 rounded-lg bg-ink-800/50 border border-ink-700/50 text-parchment-400 font-crimson text-sm hover:bg-ink-700/50 active:scale-95 transition-all"
          >
            Delete
          </button>
          <button
            onClick={() => handleNumberPress(0)}
            className="w-full h-14 rounded-lg bg-ink-800/50 border border-ink-700/50 text-parchment-200 font-cinzel font-bold text-xl hover:bg-ink-700/50 active:scale-95 transition-all"
          >
            0
          </button>
          <div /> {/* empty cell */}
        </div>

        <OrnateButton
          variant="primary"
          size="md"
          className="w-full"
          onClick={handlePinSubmit}
          disabled={pin.length < 4 || isLoading}
          loading={isLoading}
        >
          Enter
        </OrnateButton>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 font-crimson text-sm text-parchment-500 hover:text-parchment-300 transition-colors"
          >
            Go Back
          </button>
        )}
      </motion.div>
    </div>
  );
}
