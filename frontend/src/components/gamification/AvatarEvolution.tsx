import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Trophy, Zap, Star } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

interface EvolutionTier {
  name: string;
  minLevel: number;
  image: string;
  color: string;
  description: string;
  perk: string;
}

const EVOLUTION_TIERS: EvolutionTier[] = [
  {
    name: 'Novice Scribbler',
    minLevel: 1,
    image: '/brain/07062eb0-d078-468c-bfb0-3bbab786ebae/novice_scribbler_avatar_1772183028634.png',
    color: 'from-slate-400 to-slate-600',
    description: 'A humble beginner, armed only with a digital pen and curiosity.',
    perk: 'No active perks'
  },
  {
    name: 'Sage Apprentice',
    minLevel: 10,
    image: '/brain/07062eb0-d078-468c-bfb0-3bbab786ebae/sage_apprentice_avatar_1772183043365.png',
    color: 'from-blue-500 to-indigo-700',
    description: 'Mastering the basic laws of logic and memory.',
    perk: '+5% XP Multiplier'
  },
  {
    name: 'Knowledge Guardian',
    minLevel: 25,
    image: '/brain/07062eb0-d078-468c-bfb0-3bbab786ebae/knowledge_guardian_avatar_1772183055916.png',
    color: 'from-amber-400 to-orange-600',
    description: 'A protector of truth, shielded by ancient study techniques.',
    perk: 'Free Streak Shield every 7 days'
  },
  {
    name: 'Eternal Oracle',
    minLevel: 50,
    image: '/brain/07062eb0-d078-468c-bfb0-3bbab786ebae/eternal_oracle_avatar_1772183076502.png',
    color: 'from-purple-500 to-fuchsia-700',
    description: 'Transcended the physical plane. Knowledge is your essence.',
    perk: '+20% Shop Discount'
  }
];

const AvatarEvolution: React.FC = () => {
  const { profile } = useGamificationStore();
  const level = profile?.level || 1;

  const currentTier = useMemo(() => {
    return [...EVOLUTION_TIERS].reverse().find(t => level >= t.minLevel) || EVOLUTION_TIERS[0];
  }, [level]);

  const nextTier = useMemo(() => {
    return EVOLUTION_TIERS.find(t => t.minLevel > level);
  }, [level]);

  const progressToNext = nextTier 
    ? Math.round(((level - currentTier.minLevel) / (nextTier.minLevel - currentTier.minLevel)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="relative group overflow-hidden rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Tier Glow */}
        <div className={`absolute -inset-20 bg-gradient-to-br ${currentTier.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

        <div className="relative p-8 flex flex-col md:flex-row items-center gap-12">
          {/* Avatar Perspective */}
          <div className="relative w-64 h-64 md:w-80 md:h-80">
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-10 w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl"
             >
                <img 
                  src={currentTier.image} 
                  alt={currentTier.name} 
                  className="w-full h-full object-cover"
                />
             </motion.div>
             {/* Platform Shadow */}
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/20 blur-xl rounded-full" />
             
             {/* Level Badge Overlay */}
             <div className="absolute -top-4 -right-4 z-20 bg-indigo-600 text-white p-4 px-6 rounded-2xl font-black text-2xl shadow-xl ring-4 ring-white dark:ring-slate-900">
               {level}
             </div>
          </div>

          {/* Info Side */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`p-2 rounded-lg bg-gradient-to-br ${currentTier.color} text-white`}>
                   <Zap className="w-4 h-4" />
                </span>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Digital Persona</p>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {currentTier.name}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-4 max-w-md">
                "{currentTier.description}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] uppercase font-bold text-slate-500">Active Boon</p>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{currentTier.perk}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <p className="text-[10px] uppercase font-bold text-slate-500">Rank Standing</p>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Tier {EVOLUTION_TIERS.indexOf(currentTier) + 1}</p>
              </div>
            </div>

            {nextTier && (
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Evolution Progress</p>
                    <p className="text-xs font-bold text-indigo-500">Unlocks {nextTier.name} at Level {nextTier.minLevel}</p>
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">{progressToNext}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${currentTier.color} shadow-[0_0_15px_rgba(99,102,241,0.5)]`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evolution Roadmap Preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {EVOLUTION_TIERS.map((tier, idx) => {
          const isUnlocked = level >= tier.minLevel;
          const isCurrent = currentTier.name === tier.name;
          
          return (
            <div 
              key={tier.name}
              className={`relative p-6 rounded-[2rem] border transition-all ${
                isCurrent 
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl scale-105 z-10' 
                  : isUnlocked 
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                    : 'bg-slate-100/50 dark:bg-slate-900/50 border-transparent grayscale opacity-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                isUnlocked ? `bg-gradient-to-br ${tier.color} text-white shadow-lg` : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                {isUnlocked ? <Sparkles className="w-6 h-6" /> : <Star className="w-6 h-6" />}
              </div>
              <h4 className={`font-black text-sm uppercase tracking-tight ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                {tier.name}
              </h4>
              <p className="text-[10px] font-bold text-slate-500 mt-1">LV. {tier.minLevel}+</p>
              {isCurrent && (
                <div className="absolute top-4 right-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarEvolution;
