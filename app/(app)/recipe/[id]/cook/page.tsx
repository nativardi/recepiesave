// Description: Cook Mode overlay - full-screen step-by-step cooking interface with timer

"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CookModeControls } from "@/components/composites/CookModeControls";
import { IngredientChecklistRow } from "@/components/composites/IngredientChecklistRow";
import { Button } from "@/components/ui/button";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { RecipeWithDetails } from "@/lib/types/database";
import {
  findIngredientsInInstruction,
  augmentInstructionWithQuantities,
} from "@/lib/utils/ingredientMatcher";
import { useCheckedIngredients } from "@/lib/hooks/useCheckedIngredients";
import Image from "next/image";
import {
  Sun,
  SunDim,
  X,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChefHat,
  ChevronUp,
} from "lucide-react";

export default function CookModePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredientsSheet, setShowIngredientsSheet] = useState(false);

  // Shared ingredient checkbox state (syncs with recipe page)
  const { checkedIngredients, toggleIngredient } = useCheckedIngredients(recipeId);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Wake Lock state
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Load recipe
  useEffect(() => {
    async function loadRecipe() {
      const recipeData = await recipeRepository.getByIdWithDetails(recipeId);
      setRecipe(recipeData);
    }
    loadRecipe();
  }, [recipeId]);

  // Request Wake Lock
  useEffect(() => {
    async function requestWakeLock() {
      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          setWakeLockActive(true);
          wakeLockRef.current.addEventListener("release", () => {
            setWakeLockActive(false);
          });
        } catch {
          setWakeLockActive(false);
        }
      }
    }
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Play sound/vibrate when timer ends
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const setQuickTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    setShowTimerPicker(false);
  };

  const toggleTimer = () => {
    if (timerSeconds === 0) {
      setShowTimerPicker(true);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const resetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const handleNext = useCallback(() => {
    if (recipe && currentStepIndex < recipe.instructions.length - 1) {
      setDirection(1);
      // Mark current step as completed
      setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (recipe) {
      // Mark last step as completed
      setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
      router.push(`/recipe/${recipeId}`);
    }
  }, [currentStepIndex, recipe, recipeId, router]);

  const handleExit = () => {
    router.push(`/recipe/${recipeId}`);
  };

  // Get current step info (safe to use before recipe check)
  const instructions = recipe?.instructions ?? [];
  const currentStep = instructions[currentStepIndex];
  const totalSteps = instructions.length;
  const progress =
    totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  // Match ingredients for the current step (hooks must be called unconditionally)
  const matchedIngredients = useMemo(() => {
    if (!currentStep || !recipe?.ingredients?.length) return [];
    return findIngredientsInInstruction(
      currentStep.text,
      recipe.ingredients
    );
  }, [currentStep, recipe?.ingredients]);

  // Augment instruction text with ingredient quantities
  const augmentedTextSegments = useMemo(() => {
    if (!currentStep) return [];
    return augmentInstructionWithQuantities(
      currentStep.text,
      matchedIngredients
    );
  }, [currentStep, matchedIngredients]);

  // Handle ingredient toggle - uses shared hook for sync with recipe page
  const handleIngredientToggle = useCallback(
    (ingredientId: string, checked: boolean) => {
      toggleIngredient(ingredientId, checked);
    },
    [toggleIngredient]
  );

  // Loading state - MUST come after all hooks
  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <ChefHat size={48} className="text-primary" />
        </motion.div>
      </div>
    );
  }

  if (instructions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-muted mb-4">
            No instructions available for this recipe.
          </p>
          <Button onClick={handleExit}>Back to Recipe</Button>
        </motion.div>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-12 pb-2 bg-background z-20">
        <motion.div
          className="flex items-center gap-2 text-primary"
          animate={{ opacity: wakeLockActive ? 1 : 0.5 }}
        >
          {wakeLockActive ? <Sun size={20} /> : <SunDim size={20} />}
          <span className="text-xs font-semibold uppercase tracking-wider">
            {wakeLockActive ? "Screen Awake" : "Screen Sleep"}
          </span>
        </motion.div>
        <motion.button
          onClick={handleExit}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center gap-2 bg-surface px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
          aria-label="Exit Cook Mode"
        >
          <span className="text-sm font-bold text-charcoal">Exit</span>
          <X size={20} className="text-gray-500" />
        </motion.button>
      </header>

      {/* Timer Bar (when active) */}
      <AnimatePresence>
        {timerSeconds > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-6 mb-4 overflow-hidden"
          >
            <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={isTimerRunning ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                >
                  <Timer size={20} className="text-white" />
                </motion.div>
                <span className="text-3xl font-bold text-charcoal font-mono">
                  {formatTime(timerSeconds)}
                </span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTimer}
                  className="w-10 h-10 rounded-full bg-surface shadow-sm flex items-center justify-center"
                >
                  {isTimerRunning ? (
                    <Pause size={20} className="text-charcoal" />
                  ) : (
                    <Play size={20} className="text-charcoal" />
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={resetTimer}
                  className="w-10 h-10 rounded-full bg-surface shadow-sm flex items-center justify-center"
                >
                  <RotateCcw size={20} className="text-charcoal" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 pb-6 pt-2 relative z-10 overflow-hidden">
        {/* Progress Section */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-charcoal">
              Step {currentStepIndex + 1}{" "}
              <span className="text-muted text-lg font-medium">
                of {totalSteps}
              </span>
            </h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowTimerPicker(true)}
              className="flex items-center gap-1 text-primary text-sm font-medium"
            >
              <Timer size={16} />
              Set Timer
            </motion.button>
          </div>

          {/* Smooth Progress Bar */}
          <div className="h-3 w-full bg-primary/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Active Instruction Card with Animation */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-surface rounded-2xl shadow-lg p-1 overflow-hidden flex flex-col h-full max-h-[55vh]"
            >
              {/* Image Area */}
              {recipe.thumbnail_url && (
                <div className="relative h-40 shrink-0 w-full overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={recipe.thumbnail_url}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {completedSteps.has(currentStepIndex) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Check size={20} className="text-white" />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Text Content - Clean, focused on instruction */}
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                {/* Instruction Text with Ingredient Quantities */}
                <p className="text-xl text-charcoal leading-relaxed">
                  {augmentedTextSegments.map((segment, idx) =>
                    segment.isBold ? (
                      <strong key={idx} className="text-accent font-semibold">
                        {segment.text}
                      </strong>
                    ) : (
                      <span key={idx}>{segment.text}</span>
                    )
                  )}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <CookModeControls
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canGoPrevious={currentStepIndex > 0}
          canGoNext={currentStepIndex < totalSteps - 1}
        />
      </main>

      {/* Ingredients Pull-Up Handle */}
      <div className="bg-background pb-2 pt-1">
        <motion.button
          onClick={() => setShowIngredientsSheet(true)}
          whileTap={{ scale: 0.98 }}
          className="mx-auto flex flex-col items-center gap-1 w-full max-w-[200px] bg-surface px-6 py-2 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-x border-gray-200"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1">
            <ChevronUp size={14} />
            Ingredients
          </span>
        </motion.button>
      </div>

      {/* Ingredients Sheet Modal */}
      <AnimatePresence>
        {showIngredientsSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowIngredientsSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setShowIngredientsSheet(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl max-w-md mx-auto max-h-[70vh] flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-charcoal text-center">
                  Ingredients
                </h3>
                <p className="text-sm text-muted text-center mt-1">
                  {recipe.ingredients.length} items
                </p>
              </div>

              {/* Ingredients List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {recipe.ingredients.map((ingredient) => (
                  <IngredientChecklistRow
                    key={ingredient.id}
                    ingredient={ingredient}
                    checked={checkedIngredients.has(ingredient.id)}
                    onToggle={(checked) =>
                      handleIngredientToggle(ingredient.id, checked)
                    }
                  />
                ))}
              </div>

              {/* Close Button */}
              <div className="p-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowIngredientsSheet(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Timer Picker Modal */}
      <AnimatePresence>
        {showTimerPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowTimerPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 shadow-xl max-w-md mx-auto"
            >
              <h3 className="text-xl font-bold text-charcoal mb-4 text-center">
                Set Timer
              </h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[1, 2, 5, 10, 15, 20, 30, 45].map((mins) => (
                  <motion.button
                    key={mins}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuickTimer(mins)}
                    className="py-4 px-2 bg-primary/10 rounded-xl text-primary font-bold text-lg hover:bg-primary/20 transition-colors"
                  >
                    {mins}m
                  </motion.button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowTimerPicker(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
