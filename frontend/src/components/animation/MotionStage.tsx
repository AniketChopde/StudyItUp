import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionRenderer } from './MotionElements';
import type { AnimationStage } from './motionTypes';

interface MotionStageProps {
  currentStage: AnimationStage | null;
  theme: 'manim' | 'sketchy' | 'technical';
  topic?: string;
}

export const MotionStage: React.FC<MotionStageProps> = ({ 
  currentStage, 
  theme,
  topic
}) => {
  if (!currentStage) return null;

  // Safety Fallback
  const elements = (currentStage.elements && currentStage.elements.length > 0) 
    ? currentStage.elements 
    : [
        {
          id: 'safety-fallback-icon',
          type: 'icon' as const,
          icon_name: topic?.toLowerCase().includes('atom') ? 'atom' : 
                     topic?.toLowerCase().includes('brain') ? 'brain' : 'zap',
          label: topic || 'Loading...',
          position: [50, 50] as [number, number],
          size: [30, 30] as [number, number],
          color: '#58C4DD'
        }
      ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* === MANIM DARK BACKGROUND === */}
      <div className="absolute inset-0 bg-[#0f0f23]">
        {/* Radial gradient accent */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${currentStage.background_color || '#1a1a4e'}22 0%, transparent 70%)`
          }}
        />
        {/* Animated dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, #58C4DD 0.5px, transparent 0.5px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Subtle vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
        }} />
      </div>

      {/* === ANIMATION CANVAS === */}
      <div className="relative w-full h-full z-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage.step}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full p-4"
          >
            <div className="relative w-full h-full mx-auto" style={{ maxWidth: 'min(100%, 1100px)', maxHeight: '92%' }}>
              <MotionRenderer 
                elements={elements} 
                theme={theme} 
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
