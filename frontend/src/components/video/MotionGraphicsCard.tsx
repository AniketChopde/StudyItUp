import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Info, Quote } from 'lucide-react';

interface MotionGraphicsCardProps {
  type: 'title-card' | 'definition-box' | 'diagram-overlay' | 'none';
  title: string;
  description: string;
  visible: boolean;
}

export const MotionGraphicsCard: React.FC<MotionGraphicsCardProps> = ({
  type,
  title,
  description,
  visible
}) => {
  if (type === 'none' || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-1/2 left-12 -translate-y-1/2 max-w-sm z-30 pointer-events-none"
      >
        {type === 'title-card' && (
          <div className="space-y-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "80px" }}
              className="h-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"
            />
            <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
              {title.split(' ')[0]} <br />
              <span className="text-white/40">{title.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-lg font-medium text-slate-400 border-l-2 border-slate-800 pl-4">
              {description}
            </p>
          </div>
        )}

        {type === 'definition-box' && (
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Quote size={40} className="text-indigo-400 rotate-180" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">Concept Definition</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">NEXUS_LEARN_ENGINE</span>
              <div className="h-1 w-12 bg-white/10 rounded-full" />
            </div>
          </div>
        )}

        {type === 'diagram-overlay' && (
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
               <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-white tracking-tight uppercase tracking-[0.1em]">{title}</h4>
              <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-transparent w-full" />
            </div>
            <p className="text-sm font-bold text-slate-400 tracking-wide leading-relaxed">
              {description}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
