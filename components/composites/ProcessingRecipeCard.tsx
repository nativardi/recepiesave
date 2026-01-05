// Description: Premium processing recipe card - "Culinary Atelier" aesthetic
// Replaces generic loading states with elegant, food-inspired waiting experience

"use client";

import { motion } from "framer-motion";

interface ProcessingRecipeCardProps {
  className?: string;
}

export function ProcessingRecipeCard({ className }: ProcessingRecipeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden ${className || ""}`}
    >
      {/* Base gradient - warm cream to linen */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-[#F5EFE7] to-[#F0E8DC]" />

      {/* Subtle linen texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient breathing glow */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, rgba(212,116,94,0.12) 0%, transparent 60%)",
            "radial-gradient(circle at 70% 60%, rgba(212,116,94,0.12) 0%, transparent 60%)",
            "radial-gradient(circle at 30% 40%, rgba(212,116,94,0.12) 0%, transparent 60%)",
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Delicate border */}
      <div className="absolute inset-0 border border-[#E8DCC8]/40 rounded-2xl" />

      {/* Content container */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 py-8">

        {/* Botanical accent - subtle herb illustration */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            className="opacity-60"
          >
            {/* Delicate herb sprig */}
            <motion.path
              d="M24 8 L24 40"
              stroke="#6B5E52"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
            />
            <motion.path
              d="M24 16 Q20 14 18 16 Q16 18 18 20 Q20 22 24 20"
              stroke="#8BA888"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
            />
            <motion.path
              d="M24 16 Q28 14 30 16 Q32 18 30 20 Q28 22 24 20"
              stroke="#8BA888"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            />
            <motion.path
              d="M24 24 Q20 22 18 24 Q16 26 18 28 Q20 30 24 28"
              stroke="#8BA888"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
            />
            <motion.path
              d="M24 24 Q28 22 30 24 Q32 26 30 28 Q28 30 24 28"
              stroke="#8BA888"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 1.0, duration: 1, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        {/* Elegant text with staggered reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center space-y-2"
        >
          <motion.p
            className="text-[#2C2416] font-serif text-lg font-medium tracking-wide"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Crafting your recipe
          </motion.p>
          <motion.p
            className="text-[#6B5E52] text-sm font-light"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            Extracting ingredients & steps
          </motion.p>
        </motion.div>

        {/* Elegant progress dots (minimal, refined) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex gap-2 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#D4745E]"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Subtle shimmer effect */}
        <motion.div
          className="absolute inset-0 opacity-0"
          animate={{
            opacity: [0, 0.15, 0],
            background: [
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 50%, transparent 100%)",
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 50%, transparent 100%)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transform: "translateX(-100%)",
          }}
        />

      </div>

      {/* Soft inner shadow for depth */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_12px_rgba(0,0,0,0.04)] pointer-events-none" />
    </motion.div>
  );
}
