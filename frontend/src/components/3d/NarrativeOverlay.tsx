import React from 'react';
import { Play, Pause, SkipForward, Volume2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface NarrativeStep {
  step: number;
  text: string;
  caption: string;
  focus_object_id: string;
}

interface NarrativeOverlayProps {
  currentStep: NarrativeStep | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onClose: () => void;
  progress: number; // 0 to 100
  totalSteps: number;
  currentIndex: number;
}

export const NarrativeOverlay: React.FC<NarrativeOverlayProps> = ({
  currentStep,
  isPlaying,
  onTogglePlay,
  onSkip,
  onClose,
  progress,
  totalSteps,
  currentIndex,
}) => {
  if (!currentStep) return null;

  return (
    <div className="absolute inset-x-4 bottom-16 z-20 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="mx-auto max-w-xl pointer-events-auto"
        >
          {/* Glassmorphism Container */}
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl p-6 md:p-8">
            {/* Animated Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div 
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                    <Sparkles size={12} className="animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    AI Explanation • Step {currentIndex + 1} / {totalSteps}
                  </span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                  {currentStep.caption}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {currentStep.text}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    onClick={onTogglePlay}
                    className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-white/90 shadow-xl"
                  >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSkip}
                    disabled={currentIndex === totalSteps - 1}
                    className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                  >
                    <SkipForward size={18} />
                  </Button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <Volume2 size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider animate-pulse">
                    Playing AI Voice
                  </span>
                </div>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
