import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionRenderer } from './MotionElements';
import type { AnimationStage } from './motionTypes';

interface MotionStageProps {
  currentStage: AnimationStage | null;
  theme: 'manim' | 'sketchy' | 'technical' | 'whiteboard';
  topic?: string;
}

/* ============================================================
   FLOATING BACKGROUND DECORATIONS — subtle 2D art elements
   ============================================================ */
const BackgroundDecor: React.FC<{ step: number }> = ({ step }) => {
  const shapes = [
    // Top-left floating circle
    { x: '4%', y: '6%', size: 52, color: '#BBDEFB', delay: 0 },
    // Bottom-right large circle
    { x: '92%', y: '86%', size: 80, color: '#E8F5E9', delay: 0.1 },
    // Mid-right small circle
    { x: '90%', y: '20%', size: 38, color: '#FFF9C4', delay: 0.2 },
    // Bottom-left circle
    { x: '6%', y: '85%', size: 44, color: '#FCE4EC', delay: 0.15 },
  ];

  return (
    <>
      {shapes.map((s, i) => (
        <motion.div
          key={`decor-${i}-${step}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            opacity: 0.55,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.55 }}
          transition={{ delay: s.delay, duration: 0.6, type: 'spring' }}
        />
      ))}

      {/* Subtle dotted accent lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`dots-${step}`} x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#90A4AE" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${step})`} />
      </svg>
    </>
  );
};

export const MotionStage: React.FC<MotionStageProps> = ({
  currentStage,
  theme,
  topic
}) => {
  if (!currentStage) return null;

  const elements = (currentStage.elements && currentStage.elements.length > 0)
    ? currentStage.elements
    : [
        {
          id: 'safety-fallback-text',
          type: 'text' as const,
          label: topic || 'Loading...',
          position: [50, 50] as [number, number],
          size: [60, 10] as [number, number],
          color: '#1A1A2E',
          font_size: '2xl' as const,
          font_weight: 'bold' as const,
          animation: 'typewriter' as const,
          delay: 0,
        }
      ];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#F8F9FF' }}>
      {/* === GLOBAL SVG FILTERS (very subtle roughness for strokes) === */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="rough-filter" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" result="noise" seed="3" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="sketch-rough" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" result="noise" seed="7" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* === CLEAN WHITE PAPER BACKGROUND === */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F7FF 100%)',
        }}
      />

      {/* === FLOATING BACKGROUND DECORATIONS (circles, dots) === */}
      <BackgroundDecor step={currentStage.step} />

      {/* === TOP ACCENT BAR === */}
      <div className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ background: 'linear-gradient(90deg, #1565C0, #7B1FA2, #1565C0)' }}
      />

      {/* === ANIMATION CANVAS — perfectly centered === */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage.step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
            style={{ width: '96%', height: '90%', maxWidth: 1060 }}
          >
            <MotionRenderer elements={elements} theme={theme} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
