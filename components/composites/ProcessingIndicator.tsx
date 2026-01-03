// Description: Premium inline processing indicator with "Culinary Atelier" aesthetic
// Shows recipe extraction progress with elegant, food-inspired UI

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProcessingState, PROCESSING_STAGES } from "@/lib/types/processing";
import { Check } from "lucide-react";

interface ProcessingIndicatorProps {
  processingState: ProcessingState;
}

export function ProcessingIndicator({
  processingState,
}: ProcessingIndicatorProps) {
  if (processingState.status === "idle") {
    return null;
  }

  // Success state
  if (processingState.status === "success") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-[#FAF7F2] to-[#F5EFE7] border border-[#E8DCC8] rounded-3xl shadow-[0_8px_32px_rgba(212,116,94,0.12)] overflow-hidden"
        >
          {/* Subtle linen texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]" />

          <div className="relative px-8 py-6 flex flex-col items-center gap-3">
            {/* Success icon with subtle animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8BA888] to-[#6B9A68] flex items-center justify-center shadow-lg shadow-[#8BA888]/30"
            >
              <Check size={24} className="text-white" strokeWidth={3} />
            </motion.div>

            {/* Success message */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-serif font-semibold text-[#2C2416]"
            >
              Recipe saved!
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Error state
  if (processingState.status === "error") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-[#FAF7F2] to-[#F5EFE7] border border-[#E8A598] rounded-3xl shadow-[0_8px_32px_rgba(212,116,94,0.12)] overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]" />

          <div className="relative px-8 py-6 flex flex-col items-center gap-2">
            <p className="text-base font-medium text-[#D4745E]">
              {processingState.message}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Processing state
  if (processingState.status === "processing") {
    const stageInfo = PROCESSING_STAGES[processingState.stage];
    const stages = Object.values(PROCESSING_STAGES);
    const currentStageIndex = stages.findIndex(
      (s) => s.stage === processingState.stage
    );

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="processing"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative bg-gradient-to-br from-[#FAF7F2] to-[#F5EFE7] border border-[#E8DCC8] rounded-3xl shadow-[0_8px_32px_rgba(212,116,94,0.12)] overflow-hidden"
        >
          {/* Subtle linen texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]" />

          {/* Ambient glow animation */}
          <motion.div
            className="absolute inset-0 opacity-40"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(212,116,94,0.08) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(212,116,94,0.08) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(212,116,94,0.08) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative px-8 py-6 flex flex-col items-center gap-4">
            {/* Stage icon with breathing animation */}
            <motion.div
              key={processingState.stage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="text-4xl"
            >
              <motion.span
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {stageInfo.icon}
              </motion.span>
            </motion.div>

            {/* Stage label */}
            <motion.div
              key={`label-${processingState.stage}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <h3 className="text-lg font-serif font-semibold text-[#2C2416]">
                {stageInfo.label}
              </h3>
              <p className="text-sm text-[#6B5E52] font-light">
                {stageInfo.description}
              </p>
            </motion.div>

            {/* Elegant progress dots */}
            <div className="flex items-center gap-3 mt-2">
              {stages.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isUpcoming = index > currentStageIndex;

                return (
                  <motion.div
                    key={stage.stage}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.1,
                    }}
                    className="relative"
                  >
                    {/* Dot */}
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
                        isCompleted || isCurrent
                          ? "bg-gradient-to-br from-[#D4745E] to-[#B8634F]"
                          : "bg-[#E8DCC8]"
                      }`}
                      animate={
                        isCurrent
                          ? {
                              scale: [1, 1.3, 1],
                              opacity: [1, 0.7, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Ripple effect for current stage */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-[#D4745E]"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{
                          scale: 2.5,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress percentage (subtle) */}
            <motion.p
              key={`progress-${Math.floor(processingState.progress)}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-medium text-[#8B7E71] tabular-nums"
            >
              {Math.floor(processingState.progress)}%
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
