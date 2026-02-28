
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  CheckCircle2, 
  BookOpen,
  Zap,
  ArrowLeft,
  Compass,
  Map as MapIcon,
  Crown
} from 'lucide-react';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { Link, useNavigate } from 'react-router-dom';

const RelicMap: React.FC = () => {
  const navigate = useNavigate();
  const { plans } = useStudyPlanStore();
  
  const activePlan = useMemo(() => {
    return plans.find(p => p.status === 'active') || plans[0];
  }, [plans]);

  if (!activePlan) {
    return (
      <div className="-m-4 lg:-m-8 min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-6 flex flex-col items-center overflow-hidden font-sans">
        <MapIcon className="w-24 h-24 text-slate-300" />
        <h2 className="text-3xl font-black text-slate-800 italic">"The Chart is Empty, Voyager."</h2>
        <p className="text-slate-500 max-w-sm">No adventures have been plotted. Create a study plan to begin your hunt.</p>
        <button 
          onClick={() => navigate('/study-plans')}
          className="bg-amber-800 text-amber-50 px-10 py-4 rounded-full font-bold shadow-xl hover:bg-amber-900 transition-all uppercase tracking-widest text-xs"
        >
          Begin Expedition
        </button>
      </div>
    );
  }

  return (
    <div className="-m-4 lg:-m-8 bg-[#FDF6E3] relative overflow-hidden font-serif p-12 min-h-[calc(100vh-4rem)]">
      {/* Parchment Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
      
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 opacity-20 rotate-12">
        <Compass className="w-32 h-32 text-amber-900" />
      </div>
      <div className="absolute bottom-10 left-10 opacity-10">
        <MapIcon className="w-64 h-64 text-amber-900" />
      </div>

      {/* Trial Header */}
      <nav className="w-full max-w-5xl flex justify-between items-center mb-16 relative z-10">
        <div className="flex-1" />
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.4em] text-amber-800/40 font-black mb-2 block">World Explorer</span>
          <h1 className="text-4xl font-black italic text-amber-900 leading-tight">Map of {activePlan.exam_type}</h1>
        </div>
        <div className="flex gap-4">
           {/* Placeholder for collectibles if needed */}
        </div>
      </nav>

      {/* The Map Track */}
      <div className="max-w-4xl mx-auto py-20 relative z-10">
        
        {/* Winding Connection Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-2 overflow-hidden -translate-x-1/2">
           <div className="h-full w-full border-r-4 border-dashed border-amber-900/10" />
        </div>

        <div className="space-y-24 relative">
          
          {/* Start Point */}
          <div className="flex flex-col items-center">
             <div className="w-20 h-20 rounded-full bg-amber-900 flex items-center justify-center text-amber-50 shadow-2xl z-20">
                <Crown className="w-10 h-10" />
             </div>
             <span className="mt-4 text-xs font-black uppercase tracking-widest text-amber-900/40">Expedition Start</span>
          </div>

          {activePlan.chapters.sort((a, b) => a.order_index - b.order_index).map((chapter, index) => {
            const isCompleted = chapter.status === 'completed';
            const isAvailable = index === 0 || activePlan.chapters[index - 1].status === 'completed';
            const isLocked = !isAvailable && !isCompleted;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`relative flex items-center gap-12 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Node Detail */}
                <div className={`flex-1 text-right ${isEven ? 'text-right' : 'text-left'}`}>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-green-600' : isLocked ? 'text-amber-900/30' : 'text-amber-700'}`}>
                      {isCompleted ? 'Relic Found' : isLocked ? 'Unknown Territory' : 'Hidden Relic'}
                   </span>
                   <h3 className={`text-xl font-bold mt-1 max-w-xs ${isEven ? 'ml-auto' : 'mr-auto'} ${isLocked ? 'text-amber-900/20' : 'text-amber-900'}`}>
                      {chapter.chapter_name}
                   </h3>
                </div>

                {/* The Relic (Node) */}
                <Link 
                  to={`/study-plans/${activePlan.id}?chapterId=${chapter.id}`}
                  className={`relative w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 transform z-20 ${
                    isCompleted 
                      ? 'bg-emerald-100 border-4 border-emerald-500 text-emerald-600 rotate-12 shadow-xl shadow-emerald-500/20' 
                      : isLocked 
                        ? 'bg-amber-900/5 border-2 border-amber-900/10 text-amber-900/20 grayscale' 
                        : 'bg-white border-4 border-amber-700 text-amber-700 shadow-2xl shadow-amber-900/20 hover:scale-110 hover:-rotate-3'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/50 blur-xl opacity-0 hover:opacity-100 transition-opacity rounded-full scale-150" />
                  {isCompleted ? (
                    <CheckCircle2 className="w-12 h-12" />
                  ) : isLocked ? (
                    <Lock className="w-10 h-10" />
                  ) : (
                    <BookOpen className="w-12 h-12 animate-pulse" />
                  )}

                  {/* Weightage Relic Info */}
                  {!isLocked && (
                    <div className={`absolute top-0 ${isEven ? 'left-full ml-4' : 'right-full mr-4'} p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg w-32`}>
                       <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-black uppercase text-amber-900">Value</span>
                       </div>
                       <p className="text-xs font-bold text-amber-800">{chapter.weightage_percent}% Exp</p>
                    </div>
                  )}
                </Link>

                <div className="flex-1" />
              </motion.div>
            );
          })}

          {/* End Point */}
          <div className="flex flex-col items-center pt-20 pb-40">
             <div className="w-16 h-16 rounded-3xl border-4 border-dashed border-amber-900/20 flex items-center justify-center text-amber-900/10">
                <Crown className="w-8 h-8" />
             </div>
             <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-900/20 italic">Mastery Awaits</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RelicMap;
