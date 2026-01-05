// Description: Compact processing card for carousel - miniature Culinary Atelier aesthetic

"use client";

import { motion } from "framer-motion";

interface ProcessingRecipeCardCompactProps {
  className?: string;
}

export function ProcessingRecipeCardCompact({ className }: ProcessingRecipeCardCompactProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`relative w-40 aspect-square rounded-lg overflow-hidden shrink-0 ${className || ""}`}
    >
      {/* Base gradient - warm cream to linen */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-[#F5EFE7] to-[#F0E8DC]" />

      {/* Subtle linen texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient breathing glow - subtle */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, rgba(212,116,94,0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 70% 60%, rgba(212,116,94,0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 30% 40%, rgba(212,116,94,0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Delicate border */}
      <div className="absolute inset-0 border border-[#E8DCC8]/30 rounded-lg" />

      {/* Content container */}
      <div className="relative h-full flex flex-col items-center justify-center px-3 py-4 gap-2">

        {/* Botanical accent - miniature herb sprig */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="opacity-50"
          >
            {/* Simple herb stem */}
            <motion.path
              d="M12 4 L12 20"
              stroke="#6B5E52"
              strokeWidth="1.2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
            />
            {/* Left leaf */}
            <motion.path
              d="M12 9 Q10 8 9 9 Q8 10 9 11 Q10 12 12 11"
              stroke="#8BA888"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            />
            {/* Right leaf */}
            <motion.path
              d="M12 9 Q14 8 15 9 Q16 10 15 11 Q14 12 12 11"
              stroke="#8BA888"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        {/* Elegant text - minimal */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{
            delay: 0.4,
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-[#2C2416] font-serif text-xs font-medium tracking-wide text-center"
        >
          Crafting...
        </motion.p>

        {/* Minimal progress dots - just 2 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex gap-1.5 mt-1"
        >
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-[#D4745E]"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

      </div>

      {/* Soft inner shadow for depth */}
      <div className="absolute inset-0 rounded-lg shadow-[inset_0_1px_6px_rgba(0,0,0,0.03)] pointer-events-none" />
    </motion.div>
  );
}
